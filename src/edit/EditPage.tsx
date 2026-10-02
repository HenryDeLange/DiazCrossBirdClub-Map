import type { FeatureCollection, Geometry } from 'geojson';
import {
    ArrowLeft, Check, ChevronDown, ChevronUp, CircleCheck, Clipboard, ClipboardPaste, Layers,
    LoaderCircle, MapPin, Plus, Redo2, Route, Trash2, TriangleAlert, Undo2, VectorPolygon, X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { MapContainer } from 'react-leaflet';
import { getBasePathname } from '../appRouting';
import { defaultMapCenter } from '../common/defaultLocation';
import { DrawerSearchField } from '../map/components/DrawerSearchField';
import { PrimaryCategoryIcon } from '../map/controls/locations/PrimaryCategoryIcon';
import type { FeatureProps } from '../map/geojson/types';
import type { LocationTabName } from '../map/locationUtils';
import { getGeoJsonFile, getGeoJsonFiles, getGitHubFileUrl, type GitHubGeoJsonFile } from './editGithub';
import { EditorMap } from './EditorMap';
import styles from './EditPage.module.css';
import { FeaturePropertiesEditor } from './FeaturePropertiesEditor';
import { validateFeatureCollection, type EditorFeature } from './geojsonValidation';

type BusyAction = 'loading' | 'handoff' | null;
type EditorMode = 'fields' | 'raw';
type LocationType = GitHubGeoJsonFile['type'];
type ResizeAxis = 'x' | 'y' | 'feature-list';
type GeometryHistory = { future: Geometry[][]; past: Geometry[][] };
type ActiveDocument = {
    dirty: boolean;
    features: EditorFeature[];
    isNew: boolean;
    name: string;
    path: string;
    type: LocationType;
}

const locationTypes: LocationType[] = ['outings', 'paths', 'points', 'spots'];
const minimumDesktopPanelWidth = 18 * 16;
const defaultDesktopPanelWidth = 23 * 16;
const minimumMobilePanelHeight = 14 * 16;
const minimumFeatureListHeight = 6 * 16;
const defaultFeatureListHeight = 13 * 16;
const locationTabByType: Record<LocationType, LocationTabName> = {
    outings: 'Outings',
    paths: 'Paths',
    points: 'Points',
    spots: 'Spots'
};

export default function EditPage() {
    const [busy, setBusy] = useState<BusyAction>(null);
    const [error, setError] = useState('');
    const [editorMode, setEditorMode] = useState<EditorMode>('fields');
    const [rawGeoJson, setRawGeoJson] = useState('');
    const [rawErrors, setRawErrors] = useState<string[]>([]);
    const [clipboardFeedback, setClipboardFeedback] = useState('');
    const [files] = useState(() => getGeoJsonFiles());
    const [locationSearch, setLocationSearch] = useState('');
    const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('');
    const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null);
    const [locationSectionCollapsed, setLocationSectionCollapsed] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [desktopPanelWidth, setDesktopPanelWidth] = useState<number | null>(null);
    const [mobilePanelHeight, setMobilePanelHeight] = useState<number | null>(null);
    const [featureListHeight, setFeatureListHeight] = useState<number | null>(null);
    const [mobileEditorTab, setMobileEditorTab] = useState<'locations' | 'properties'>('locations');
    const [canUndoGeometry, setCanUndoGeometry] = useState(false);
    const [canRedoGeometry, setCanRedoGeometry] = useState(false);
    const [geometryModeActive, setGeometryModeActive] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(0);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationType, setNewLocationType] = useState<LocationType>('spots');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const workspaceRef = useRef<HTMLElement>(null);
    const panelBodyRef = useRef<HTMLDivElement>(null);
    const resizeAxis = useRef<ResizeAxis | null>(null);
    const editorHistoryEntryRef = useRef(false);
    const geometryHistory = useRef<GeometryHistory>({ past: [], future: [] });

    const validation = activeDocument
        ? validateFeatureCollection({ type: 'FeatureCollection', features: activeDocument.features })
        : { valid: false, errors: [] as string[] };
    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedLocationSearch(locationSearch.trim().toLowerCase()), 250);
        return () => window.clearTimeout(timeout);
    }, [locationSearch]);

    useEffect(() => {
        if (!activeDocument?.dirty) {
            return;
        }
        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeUnload);
        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [activeDocument?.dirty]);

    const visibleFiles = files
        .filter((file) => !debouncedLocationSearch || `${file.name} ${file.path}`.toLowerCase().includes(debouncedLocationSearch))
        .sort((left, right) => left.name.replace(/\.json$/i, '').localeCompare(right.name.replace(/\.json$/i, ''), undefined, { sensitivity: 'base' })
            || left.path.localeCompare(right.path));
    const isBusy = busy !== null;
    const pointCount = activeDocument?.features.filter((item) => item.geometry.type === 'Point').length ?? 0;
    const workspaceStyle: CSSProperties & { '--editor-panel-width'?: string; '--editor-panel-height'?: string; '--editor-feature-list-height'?: string } = {
        '--editor-panel-width': desktopPanelWidth === null ? undefined : `${desktopPanelWidth}px`,
        '--editor-panel-height': mobilePanelHeight === null ? undefined : `${mobilePanelHeight}px`,
        '--editor-feature-list-height': featureListHeight === null ? undefined : `${featureListHeight}px`
    };

    const clearGeometryHistory = useCallback(() => {
        geometryHistory.current = { past: [], future: [] };
        setCanUndoGeometry(false);
        setCanRedoGeometry(false);
    }, []);

    const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>, axis: ResizeAxis) => {
        event.preventDefault();
        resizeAxis.current = axis;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (resizeAxis.current === 'feature-list') {
            const panelBody = panelBodyRef.current;
            if (!panelBody) {
                return;
            }
            const bounds = panelBody.getBoundingClientRect();
            setFeatureListHeight(clampPanelSize(
                event.clientY - bounds.top,
                minimumFeatureListHeight,
                getMaxFeatureListHeight(panelBody)
            ));
            return;
        }
        const workspace = workspaceRef.current;
        const axis = resizeAxis.current;
        if (!workspace || !axis) {
            return;
        }
        const bounds = workspace.getBoundingClientRect();
        if (axis === 'x') {
            setDesktopPanelWidth(clampPanelSize(bounds.right - event.clientX, minimumDesktopPanelWidth, getMaxDesktopPanelWidth(workspace)));
        }
        else {
            setMobilePanelHeight(clampPanelSize(bounds.bottom - event.clientY, minimumMobilePanelHeight, getMaxMobilePanelHeight(workspace)));
        }
    };

    const handleResizePointerEnd = () => {
        resizeAxis.current = null;
    };

    const handleResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, axis: ResizeAxis) => {
        const positiveKey = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
        const negativeKey = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
        if (event.key !== positiveKey && event.key !== negativeKey) {
            return;
        }
        event.preventDefault();
        const delta = event.shiftKey ? 64 : 16;
        if (axis === 'x') {
            const currentWidth = desktopPanelWidth ?? defaultDesktopPanelWidth;
            setDesktopPanelWidth(clampPanelSize(
                currentWidth + (event.key === positiveKey ? delta : -delta),
                minimumDesktopPanelWidth,
                getMaxDesktopPanelWidth(workspaceRef.current)
            ));
        }
        else if (axis === 'y') {
            const currentHeight = mobilePanelHeight ?? window.innerHeight * 0.44;
            setMobilePanelHeight(clampPanelSize(
                currentHeight + (event.key === positiveKey ? delta : -delta),
                minimumMobilePanelHeight,
                getMaxMobilePanelHeight(workspaceRef.current)
            ));
        }
        else {
            const currentHeight = featureListHeight ?? defaultFeatureListHeight;
            setFeatureListHeight(clampPanelSize(
                currentHeight + (event.key === positiveKey ? delta : -delta),
                minimumFeatureListHeight,
                getMaxFeatureListHeight(panelBodyRef.current)
            ));
        }
    };

    const handleBeginCreate = () => {
        setIsCreating(true);
        setError('');
    };

    const pushEditorHistoryEntry = useCallback(() => {
        if (editorHistoryEntryRef.current) {
            return;
        }
        window.history.pushState({ ...window.history.state, editorDocument: true }, '', window.location.href);
        editorHistoryEntryRef.current = true;
    }, []);

    const closeEditorPanel = useCallback(() => {
        if (activeDocument?.dirty && !window.confirm('Discard unsaved changes to this GeoJSON document?')) {
            return false;
        }
        setActiveDocument(null);
        setIsCreating(false);
        setConfirmDelete(false);
        setError('');
        setMobileEditorTab('locations');
        clearGeometryHistory();
        return true;
    }, [activeDocument?.dirty, clearGeometryHistory]);

    const handleBackToLocations = () => {
        if (!closeEditorPanel()) {
            return;
        }
        if (editorHistoryEntryRef.current) {
            editorHistoryEntryRef.current = false;
            window.history.back();
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            if (!editorHistoryEntryRef.current) {
                return;
            }
            editorHistoryEntryRef.current = false;
            if (!closeEditorPanel()) {
                pushEditorHistoryEntry();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [closeEditorPanel, pushEditorHistoryEntry]);

    const handleOpenFile = async (file: GitHubGeoJsonFile) => {
        setBusy('loading');
        setError('');
        try {
            const collection = await getGeoJsonFile(file.path);
            const features = collection.features as EditorFeature[];
            pushEditorHistoryEntry();
            setActiveDocument({
                dirty: false,
                features,
                isNew: false,
                name: file.name,
                path: file.path,
                type: file.type
            });
            clearGeometryHistory();
            setLocationSectionCollapsed(false);
            setIsCreating(false);
            setRawGeoJson(serializeFeatures(features));
            setRawErrors([]);
            setEditorMode('fields');
            setClipboardFeedback('');
            setSelectedFeature(0);
            setMobileEditorTab('locations');
            setConfirmDelete(false);
        }
        catch (openError) {
            setError(toErrorMessage(openError));
        }
        finally {
            setBusy(null);
        }
    };

    const handleCreateLocation = () => {
        const name = newLocationName.trim();
        if (!name) {
            setError('Enter a location name before creating the file.');
            return;
        }
        const fileName = `${toCamelCase(name)}.json`;
        const path = `src/assets/geojson/${newLocationType}/${fileName}`;
        if (files.some((file) => file.path === path)) {
            setError(`A file named ${fileName} already exists in ${newLocationType}.`);
            return;
        }

        const firstFeature: EditorFeature = {
            type: 'Feature',
            properties: { name, category: 'title' },
            geometry: { type: 'Point', coordinates: [defaultMapCenter.lng, defaultMapCenter.lat] }
        };
        pushEditorHistoryEntry();
        setActiveDocument({ dirty: true, features: [firstFeature], isNew: true, name: fileName, path, type: newLocationType });
        clearGeometryHistory();
        setLocationSectionCollapsed(false);
        setIsCreating(false);
        setRawGeoJson(serializeFeatures([firstFeature]));
        setRawErrors([]);
        setEditorMode('fields');
        setClipboardFeedback('');
        setSelectedFeature(0);
        setMobileEditorTab('locations');
        setNewLocationName('');
        setError('');
    };

    const updateFeatures = (features: EditorFeature[]) => {
        if (!activeDocument) {
            return;
        }
        const previousGeometries = activeDocument.features.map((item) => item.geometry);
        const sameFeatureShapes = activeDocument.features.length === features.length
            && activeDocument.features.every((item, index) => item.geometry.type === features[index].geometry.type);
        const changedGeometry = sameFeatureShapes
            && previousGeometries.some((geometry, index) => JSON.stringify(geometry) !== JSON.stringify(features[index].geometry));
        if (changedGeometry) {
            geometryHistory.current = {
                past: [...geometryHistory.current.past, previousGeometries].slice(-50),
                future: []
            };
            setCanUndoGeometry(true);
            setCanRedoGeometry(false);
        }
        else if (!sameFeatureShapes) {
            clearGeometryHistory();
        }
        setActiveDocument((current) => current ? { ...current, dirty: true, features } : current);
    };

    const handleUndoGeometry = () => {
        if (!activeDocument) {
            return;
        }
        const { past, future } = geometryHistory.current;
        const previousGeometries = past[past.length - 1];
        if (!previousGeometries || !canApplyGeometries(activeDocument.features, previousGeometries)) {
            clearGeometryHistory();
            return;
        }
        geometryHistory.current = {
            past: past.slice(0, -1),
            future: [activeDocument.features.map((item) => item.geometry), ...future].slice(0, 50)
        };
        setCanUndoGeometry(past.length > 1);
        setCanRedoGeometry(true);
        setActiveDocument({ ...activeDocument, dirty: true, features: applyGeometries(activeDocument.features, previousGeometries) });
    };

    const handleRedoGeometry = () => {
        if (!activeDocument) {
            return;
        }
        const { past, future } = geometryHistory.current;
        const nextGeometries = future[0];
        if (!nextGeometries || !canApplyGeometries(activeDocument.features, nextGeometries)) {
            clearGeometryHistory();
            return;
        }
        geometryHistory.current = {
            past: [...past, activeDocument.features.map((item) => item.geometry)].slice(-50),
            future: future.slice(1)
        };
        setCanUndoGeometry(true);
        setCanRedoGeometry(future.length > 1);
        setActiveDocument({ ...activeDocument, dirty: true, features: applyGeometries(activeDocument.features, nextGeometries) });
    };

    const handleSelectFeature = useCallback((index: number) => {
        setSelectedFeature(index);
        setMobileEditorTab('properties');
    }, []);

    const updateProperties = useCallback((properties: FeatureProps) => {
        setActiveDocument((current) => {
            if (!current?.features[selectedFeature]) {
                return current;
            }
            const features = [...current.features];
            const selected = features[selectedFeature];
            let selectedProperties = properties;
            if (selected.geometry.type === 'Point' && properties.category !== selected.properties.category) {
                if (properties.category === 'title') {
                    let isCoastal = properties.isCoastal;
                    features.forEach((item, index) => {
                        if (index !== selectedFeature && item.geometry.type === 'Point' && item.properties.category === 'title') {
                            if (item.properties.isCoastal !== undefined) {
                                isCoastal = item.properties.isCoastal;
                            }
                            const demotedProperties: FeatureProps = { ...item.properties, category: 'spot' };
                            delete demotedProperties.isCoastal;
                            features[index] = { ...item, properties: demotedProperties };
                        }
                    });
                    selectedProperties = { ...properties };
                    if (isCoastal !== undefined) {
                        selectedProperties.isCoastal = isCoastal;
                    }
                }
                else if (selected.properties.category === 'title') {
                    const replacementIndex = features.findIndex((item, index) => index !== selectedFeature && item.geometry.type === 'Point');
                    if (replacementIndex < 0) {
                        if (features.length > 1) {
                            return current;
                        }
                    }
                    else {
                        const replacement = features[replacementIndex];
                        const replacementProperties: FeatureProps = { ...replacement.properties, category: 'title' };
                        const isCoastal = selected.properties.isCoastal ?? properties.isCoastal ?? replacement.properties.isCoastal;
                        if (isCoastal !== undefined) {
                            replacementProperties.isCoastal = isCoastal;
                        }
                        else {
                            delete replacementProperties.isCoastal;
                        }
                        features[replacementIndex] = { ...replacement, properties: replacementProperties };
                    }
                    selectedProperties = { ...properties };
                    delete selectedProperties.isCoastal;
                }
            }
            features[selectedFeature] = { ...selected, properties: selectedProperties };
            return { ...current, dirty: true, features };
        });
    }, [selectedFeature]);

    const handleSetEditorMode = (mode: EditorMode) => {
        if (mode === editorMode) {
            return;
        }
        if (mode === 'fields' && rawErrors.length > 0) {
            return;
        }
        if (mode === 'raw' && activeDocument) {
            setRawGeoJson(serializeFeatures(activeDocument.features));
            setRawErrors([]);
        }
        setClipboardFeedback('');
        setEditorMode(mode);
    };

    const handleRawGeoJsonChange = (value: string) => {
        setRawGeoJson(value);
        setClipboardFeedback('');
        clearGeometryHistory();
        setActiveDocument((current) => current ? { ...current, dirty: true } : current);
        let parsed: unknown;
        try {
            parsed = JSON.parse(value);
        }
        catch {
            setRawErrors(['Raw GeoJSON must be valid JSON.']);
            return;
        }
        const result = validateFeatureCollection(parsed);
        if (!result.valid) {
            setRawErrors(result.errors);
            return;
        }
        const collection = parsed as FeatureCollection<Geometry, FeatureProps>;
        setRawErrors([]);
        setActiveDocument((current) => current ? { ...current, dirty: true, features: collection.features as EditorFeature[] } : current);
        setSelectedFeature((current) => Math.min(current, collection.features.length - 1));
    };

    const handleCopyRawGeoJson = async () => {
        try {
            await navigator.clipboard.writeText(rawGeoJson);
            setClipboardFeedback('Copied.');
            setError('');
        }
        catch {
            setError('Clipboard access is unavailable. Allow clipboard access or use the keyboard shortcut.');
        }
    };

    const handlePasteRawGeoJson = async () => {
        try {
            const text = await navigator.clipboard.readText();
            handleRawGeoJsonChange(text);
            setClipboardFeedback('Pasted.');
            setError('');
        }
        catch {
            setError('Clipboard access is unavailable. Allow clipboard access or paste with the keyboard shortcut.');
        }
    };

    const reorderFeature = (index: number, direction: -1 | 1) => {
        if (!activeDocument) {
            return;
        }
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= activeDocument.features.length) {
            return;
        }
        const features = [...activeDocument.features];
        [features[index], features[nextIndex]] = [features[nextIndex], features[index]];
        clearGeometryHistory();
        setActiveDocument({ ...activeDocument, dirty: true, features });
        setSelectedFeature(nextIndex);
    };

    const deleteFeature = (index: number) => {
        if (!activeDocument) {
            return;
        }
        const features = activeDocument.features.filter((_feature, featureIndex) => featureIndex !== index);
        if (activeDocument.features[index]?.properties.category === 'title') {
            const replacementIndex = features.findIndex((item) => item.geometry.type === 'Point');
            if (replacementIndex < 0) {
                return;
            }
            features[replacementIndex] = {
                ...features[replacementIndex],
                properties: { ...features[replacementIndex].properties, category: 'title' }
            };
        }
        clearGeometryHistory();
        setActiveDocument({ ...activeDocument, dirty: true, features });
        setSelectedFeature((selected) => selected === index
            ? Math.min(index, features.length - 1)
            : selected > index ? selected - 1 : selected);
    };

    const handleOpenGitHubEditor = async () => {
        if (!activeDocument || isBusy || !activeDocument.dirty || !validation.valid || rawErrors.length > 0) {
            return;
        }

        const githubTab = window.open('about:blank', '_blank');
        if (!githubTab) {
            setError('The browser blocked the new tab. Allow pop-ups for this site and try again.');
            return;
        }
        githubTab.opener = null;
        setBusy('handoff');
        setError('');
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard access is unavailable. Open this page over HTTPS and allow clipboard access.');
            }
            const collection: FeatureCollection<Geometry, FeatureProps> = {
                type: 'FeatureCollection',
                features: activeDocument.features
            };
            await navigator.clipboard.writeText(`${JSON.stringify(collection, null, 2)}\n`);
            const url = getGitHubFileUrl(activeDocument.path, activeDocument.isNew ? 'new' : 'edit');
            githubTab.location.replace(url);
        }
        catch (handoffError) {
            githubTab?.close();
            setError(toErrorMessage(handoffError));
        }
        finally {
            setBusy(null);
        }
    };

    const handleDeleteOnGitHub = () => {
        if (!activeDocument || activeDocument.isNew) {
            return;
        }
        window.open(getGitHubFileUrl(activeDocument.path, 'delete'), '_blank', 'noopener,noreferrer');
    };

    const feature = activeDocument?.features[selectedFeature];
    const canDemoteTitleToSpot = activeDocument !== null
        && (activeDocument.features.length === 1
            || activeDocument.features.some((item, index) => index !== selectedFeature && item.geometry.type === 'Point'));
    const typeLabel = activeDocument ? capitalize(activeDocument.type) : '';
    const editorErrors = editorMode === 'raw' ? rawErrors : validation.errors;

    return (
        <main className={styles.page}>
            <header className={styles.topbar}>
                <div className={styles.toolbarRow}>
                    <div className={styles.brand}>
                        <a href={getBasePathname()} className={styles.ghostIconButton} title='Back to the birding map' aria-label='Back to the birding map'><ArrowLeft /></a>
                        <div className={styles.brandTitle}><strong>Editor</strong></div>
                        {activeDocument && editorMode === 'fields' && geometryModeActive && <div className={styles.historyActions}>
                            <button type='button' className={styles.iconButton} onClick={handleUndoGeometry} disabled={isBusy || !canUndoGeometry} title='Undo map geometry change' aria-label='Undo map geometry change'><Undo2 /></button>
                            <button type='button' className={styles.iconButton} onClick={handleRedoGeometry} disabled={isBusy || !canRedoGeometry} title='Redo map geometry change' aria-label='Redo map geometry change'><Redo2 /></button>
                        </div>}
                    </div>
                    <div className={styles.topbarActions}>
                        {!activeDocument && !isCreating && <button type='button' className={`${styles.button} ${styles.outlineButton}`} onClick={handleBeginCreate} disabled={isBusy}><Plus /> Create</button>}
                        {activeDocument && !confirmDelete && <>
                            {!activeDocument.isNew && !confirmDelete && <button type='button' className={`${styles.button} ${styles.outlineButton}`} onClick={() => setConfirmDelete(true)} disabled={isBusy}><Trash2 /> Delete</button>}
                            <button type='button' className={`${styles.button} ${styles.outlineButton}`} onClick={() => void handleOpenGitHubEditor()} disabled={isBusy || !activeDocument.dirty || !validation.valid || rawErrors.length > 0}>
                                {busy !== null
                                    ? <LoaderCircle />
                                    : !validation.valid || rawErrors.length > 0
                                        ? <TriangleAlert />
                                        : !activeDocument.dirty ? <CircleCheck /> : <Clipboard />} Copy, Open GitHub
                            </button>
                        </>}
                        {confirmDelete && <div className={styles.deleteConfirm}>
                            <span>Delete file?</span>
                            <button type='button' className={styles.dangerButton} onClick={handleDeleteOnGitHub} disabled={isBusy}><Trash2 /> Confirm delete</button>
                            <button type='button' className={styles.iconButton} onClick={() => setConfirmDelete(false)} aria-label='Cancel delete'><X /></button>
                        </div>}
                    </div>
                </div>
            </header>

            <section className={styles.workspace} ref={workspaceRef} style={workspaceStyle}>
                <div className={styles.mapPanel}>
                    <MapContainer
                        center={[defaultMapCenter.lat, defaultMapCenter.lng]}
                        zoom={11}
                        scrollWheelZoom
                        attributionControl={false}
                        className={styles.map}
                    >
                        <EditorMap
                            features={activeDocument?.features ?? []}
                            filePath={activeDocument?.path ?? ''}
                            onChange={updateFeatures}
                            onGeometryModeChange={setGeometryModeActive}
                            onSelect={handleSelectFeature}
                            editable={activeDocument !== null && editorMode === 'fields' && !isBusy}
                        />
                    </MapContainer>
                    {!activeDocument && !isCreating && <div className={styles.mapEmpty}>Choose a location or create a new GeoJSON file.</div>}
                </div>

                <div
                    className={`${styles.resizeHandle} ${styles.desktopResizeHandle}`}
                    role='separator'
                    aria-label='Resize editor panel'
                    aria-orientation='vertical'
                    aria-controls='editor-panel'
                    aria-valuemin={minimumDesktopPanelWidth}
                    aria-valuemax={Math.max(minimumDesktopPanelWidth, window.innerWidth * 0.65)}
                    aria-valuenow={desktopPanelWidth ?? defaultDesktopPanelWidth}
                    tabIndex={0}
                    onPointerDown={(event) => handleResizePointerDown(event, 'x')}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerEnd}
                    onPointerCancel={handleResizePointerEnd}
                    onKeyDown={(event) => handleResizeKeyDown(event, 'x')}
                />
                <div
                    className={`${styles.resizeHandle} ${styles.mobileResizeHandle}`}
                    role='separator'
                    aria-label='Resize bottom panel'
                    aria-orientation='horizontal'
                    aria-controls='editor-panel'
                    aria-valuemin={minimumMobilePanelHeight}
                    aria-valuemax={Math.max(minimumMobilePanelHeight, window.innerHeight * 0.66)}
                    aria-valuenow={mobilePanelHeight ?? window.innerHeight * 0.44}
                    tabIndex={0}
                    onPointerDown={(event) => handleResizePointerDown(event, 'y')}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerEnd}
                    onPointerCancel={handleResizePointerEnd}
                    onKeyDown={(event) => handleResizeKeyDown(event, 'y')}
                />

                <aside className={styles.sidePanel} id='editor-panel' aria-label='GeoJSON editor'>
                    <div className={styles.panelHeader}>
                        {(activeDocument || isCreating) && <button type='button' className={styles.ghostIconButton} onClick={handleBackToLocations} title='Back to locations' aria-label='Back to locations'><ArrowLeft /></button>}
                        <h2>{activeDocument ? activeDocument.name : isCreating ? 'New location' : 'Locations'}</h2>
                        {activeDocument && <button
                            type='button'
                            className={styles.modeHeaderButton}
                            onClick={() => handleSetEditorMode(editorMode === 'fields' ? 'raw' : 'fields')}
                            disabled={editorMode === 'raw' && rawErrors.length > 0}
                            title={editorMode === 'fields' ? 'Show JSON' : 'Show Fields'}
                        >{editorMode === 'fields' ? 'Show JSON' : 'Show Fields'}</button>}
                    </div>
                    <div
                        ref={panelBodyRef}
                        className={`${styles.panelBody} ${editorMode === 'raw' ? styles.rawPanelBody : ''} ${activeDocument && editorMode === 'fields' ? `${styles.featureEditorBody} ${mobileEditorTab === 'locations' ? styles.mobileLocationsActive : styles.mobilePropertiesActive}` : ''}`}
                    >
                        {activeDocument && editorMode === 'fields' && <div className={styles.mobileEditorTabs} role='group' aria-label='Editor sections'>
                            <button type='button' aria-pressed={mobileEditorTab === 'locations'} onClick={() => setMobileEditorTab('locations')}>Birding location</button>
                            <button type='button' aria-pressed={mobileEditorTab === 'properties'} onClick={() => setMobileEditorTab('properties')}>Field properties</button>
                        </div>}
                        {!isCreating && (!activeDocument || editorMode === 'fields') && <section className={`${styles.panelSection} ${activeDocument ? styles.locationPanelSection : ''} ${locationSectionCollapsed ? styles.locationListCollapsed : ''}`}>
                            <div className={styles.locationSectionHeading}>
                                <h3 className={styles.sectionTitle}>{activeDocument ? 'Birding location' : 'Existing locations'}</h3>
                                {activeDocument && <div className={styles.locationTypeBadge}>
                                    <PrimaryCategoryIcon tabLabel={locationTabByType[activeDocument.type]} />
                                    <span>{typeLabel}</span>
                                </div>}
                                {activeDocument && <button
                                    type='button'
                                    className={styles.sectionCollapseButton}
                                    aria-expanded={!locationSectionCollapsed}
                                    aria-label={`${locationSectionCollapsed ? 'Expand' : 'Collapse'} birding location`}
                                    title={`${locationSectionCollapsed ? 'Expand' : 'Collapse'} birding location`}
                                    onClick={() => setLocationSectionCollapsed((collapsed) => !collapsed)}
                                >{locationSectionCollapsed ? <ChevronDown /> : <ChevronUp />}</button>}
                            </div>
                            {!activeDocument && <>
                                <div className={styles.locationSearch}>
                                    <DrawerSearchField
                                        ariaLabel='Search locations'
                                        onChange={setLocationSearch}
                                        placeholder='Search locations'
                                        value={locationSearch}
                                        variant='panel'
                                    />
                                </div>
                                <div className={styles.fileList}>
                                {visibleFiles.map((file) => <div className={styles.fileRow} key={file.path}>
                                    <button type='button' className={styles.fileButton} aria-current={false} onClick={() => handleOpenFile(file)} disabled={isBusy} title={file.path}>
                                        <PrimaryCategoryIcon tabLabel={locationTabByType[file.type]} /><span>{file.name.replace(/\.json$/i, '')}</span>
                                    </button>
                                </div>)}
                                {files.length === 0 && <div className={styles.noData}>No bundled GeoJSON files found.</div>}
                                {files.length > 0 && visibleFiles.length === 0 && <div className={styles.noData}>No locations match your search.</div>}
                                </div>
                            </>}
                            {activeDocument && editorMode === 'fields' && <div className={`${styles.featureList} ${locationSectionCollapsed ? styles.featureListCollapsed : ''}`} id='editor-feature-list'>
                                {activeDocument.features.map((item, index) => (
                                    <div className={styles.featureRow} key={`${index}-${item.id ?? item.properties.name}`}>
                                        <button type='button' className={styles.featureButton} aria-pressed={selectedFeature === index} onClick={() => { setSelectedFeature(index); setMobileEditorTab('properties'); }}>
                                            <FeatureGeometryIcon geometryType={item.geometry.type} />
                                            <span>{item.properties.name || 'Unnamed feature'}</span>
                                            {item.properties.category === 'title' && <span className={styles.titleTag}>Title</span>}
                                        </button>
                                        <div className={styles.rowActions}>
                                            <button type='button' className={styles.orderButton} title='Move up' aria-label='Move up' onClick={() => reorderFeature(index, -1)} disabled={index === 0 || isBusy}><ChevronUp /></button>
                                            <button type='button' className={styles.orderButton} title='Move down' aria-label='Move down' onClick={() => reorderFeature(index, 1)} disabled={index >= activeDocument.features.length - 1 || isBusy}><ChevronDown /></button>
                                            <button type='button' className={styles.orderButton} title='Remove feature' aria-label='Remove feature' onClick={() => deleteFeature(index)} disabled={isBusy || (item.properties.category === 'title' && pointCount === 1)}><Trash2 /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>}
                        </section>}

                        {activeDocument && editorMode === 'fields' && !locationSectionCollapsed && <div
                            className={`${styles.resizeHandle} ${styles.featureResizeHandle}`}
                            role='separator'
                            aria-label='Resize birding location list'
                            aria-orientation='horizontal'
                            aria-controls='editor-feature-list'
                            aria-valuemin={minimumFeatureListHeight}
                            aria-valuemax={Math.max(minimumFeatureListHeight, window.innerHeight * 0.55)}
                            aria-valuenow={featureListHeight ?? defaultFeatureListHeight}
                            tabIndex={0}
                            onPointerDown={(event) => handleResizePointerDown(event, 'feature-list')}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerEnd}
                            onPointerCancel={handleResizePointerEnd}
                            onKeyDown={(event) => handleResizeKeyDown(event, 'feature-list')}
                        />}

                        {!activeDocument && isCreating && <section className={`${styles.panelSection} ${styles.createSection}`}>
                            <div className={styles.formGrid}>
                                <label className={styles.field}>
                                    <span>Location type</span>
                                    <select value={newLocationType} onChange={(event) => setNewLocationType(event.target.value as LocationType)}>
                                        {locationTypes.map((type) => <option value={type} key={type}>{capitalize(type)}</option>)}
                                    </select>
                                </label>
                                <label className={styles.field}>
                                    <span>Location name</span>
                                    <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} maxLength={120} onKeyDown={(event) => { if (event.key === 'Enter') handleCreateLocation(); }} />
                                </label>
                                <button type='button' className={`${styles.button} ${styles.outlineButton}`} onClick={handleCreateLocation} disabled={isBusy}><Check /> Confirm</button>
                            </div>
                        </section>}

                        {feature && <section className={`${styles.panelSection} ${editorMode === 'raw' ? styles.rawEditorSection : styles.propertyPanelSection}`}>
                            {editorMode === 'fields'
                                ? <>
                                    <h3 className={styles.sectionTitle}>{geometryLabel(feature.geometry.type)} properties</h3>
                                    <FeaturePropertiesEditor canDemoteTitleToSpot={canDemoteTitleToSpot} feature={feature} onChange={updateProperties} disabled={isBusy} />
                                </>
                                : <>
                                    <div className={styles.rawEditorHeader}>
                                        <h3 className={styles.sectionTitle}>GeoJSON</h3>
                                        <div className={styles.rawEditorActions}>
                                        <button type='button' className={styles.iconButton} onClick={() => void handleCopyRawGeoJson()} title='Copy raw GeoJSON' aria-label='Copy raw GeoJSON'><Clipboard /></button>
                                        <button type='button' className={styles.iconButton} onClick={() => void handlePasteRawGeoJson()} title='Paste GeoJSON from clipboard' aria-label='Paste GeoJSON from clipboard'><ClipboardPaste /></button>
                                        {clipboardFeedback && <span role='status'>{clipboardFeedback}</span>}
                                        </div>
                                    </div>
                                    <div className={styles.rawEditorPanel}>
                                        <textarea className={styles.rawEditor} aria-label='Raw GeoJSON' spellCheck={false} value={rawGeoJson} onChange={(event) => handleRawGeoJsonChange(event.target.value)} />
                                    </div>
                                </>}
                        </section>}

                        {activeDocument && editorErrors.length > 0 && <div className={styles.validationBox} role='alert'>
                            <strong>Fix these issues before handing off</strong>
                            <ul>{editorErrors.map((validationError) => <li key={validationError}>{validationError}</li>)}</ul>
                        </div>}
                        {error && <div className={`${styles.messageBox} ${styles.messageError}`} role='alert'>{error}</div>}
                    </div>

                </aside>
            </section>
        </main>
    );
}

function geometryLabel(type: Geometry['type']): string {
    return type.replace('Multi', 'Multi ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function getMaxDesktopPanelWidth(workspace: HTMLElement | null): number {
    const workspaceWidth = workspace?.getBoundingClientRect().width;
    if (workspaceWidth === undefined) {
        return defaultDesktopPanelWidth;
    }
    return Math.max(minimumDesktopPanelWidth, Math.min(workspaceWidth * 0.65, workspaceWidth - 20 * 16 - 8));
}

function getMaxMobilePanelHeight(workspace: HTMLElement | null): number {
    const workspaceHeight = workspace?.getBoundingClientRect().height;
    if (workspaceHeight === undefined) {
        return window.innerHeight * 0.44;
    }
    return Math.max(minimumMobilePanelHeight, workspaceHeight - window.innerHeight * 0.34 - 8);
}

function getMaxFeatureListHeight(panelBody: HTMLElement | null): number {
    const panelHeight = panelBody?.getBoundingClientRect().height;
    if (panelHeight === undefined) {
        return defaultFeatureListHeight;
    }
    return Math.max(minimumFeatureListHeight, panelHeight - 12 * 16);
}

function canApplyGeometries(features: EditorFeature[], geometries: Geometry[]): boolean {
    return features.length === geometries.length
        && features.every((feature, index) => feature.geometry.type === geometries[index].type);
}

function applyGeometries(features: EditorFeature[], geometries: Geometry[]): EditorFeature[] {
    return features.map((feature, index) => ({ ...feature, geometry: geometries[index] }));
}

function clampPanelSize(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function FeatureGeometryIcon({ geometryType }: Readonly<{ geometryType: Geometry['type'] }>) {
    const Icon = geometryType === 'Point'
        ? MapPin
        : geometryType === 'LineString' || geometryType === 'MultiLineString'
            ? Route
            : geometryType === 'Polygon' ? VectorPolygon : Layers;
    return <Icon className={styles.geometryIcon} aria-hidden='true' />;
}

function serializeFeatures(features: EditorFeature[]): string {
    const collection: FeatureCollection<Geometry, FeatureProps> = { type: 'FeatureCollection', features };
    return `${JSON.stringify(collection, null, 2)}\n`;
}

function capitalize(value: string): string {
    return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function toCamelCase(value: string): string {
    const words = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[a-zA-Z0-9]+/g) ?? [];
    const fileName = words.map((word, index) => index === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`).join('');
    return fileName || 'newLocation';
}

function toErrorMessage(value: unknown): string {
    return value instanceof Error ? value.message : 'An unexpected error occurred.';
}