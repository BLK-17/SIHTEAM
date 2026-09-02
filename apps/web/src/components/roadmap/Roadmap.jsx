import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useEdgesState,
    useNodesState
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import RoadmapNode from './RoadmapNode';
import { api } from '../../lib/api';

import './roadmap.css';


const nodeTypes = {
    skill: RoadmapNode,
    project: RoadmapNode
};


const STATUS_FILTERS = [
    {
        id: 'all',
        label: 'All'
    },
    {
        id: 'completed',
        label: 'Completed'
    },
    {
        id: 'in-progress',
        label: 'In Progress'
    },
    {
        id: 'available',
        label: 'Next'
    },
    {
        id: 'locked',
        label: 'Locked'
    }
];


function normalizeNode(node, index) {

    const status =
        node.data?.status ||
        node.status ||
        'available';

    const progress =
        Number(
            node.data?.progress ??
            node.progress ??
            0
        );

    return {
        ...node,

        type:
            node.type ||
            node.node_type ||
            'skill',

        position:
            node.position || {
                x: (index % 4) * 320,
                y: Math.floor(index / 4) * 230
            },

        data: {
            ...node.data,

            id:
                node.data?.id ||
                node.id,

            title:
                node.data?.title ||
                node.title ||
                'Untitled Skill',

            category:
                node.data?.category ||
                node.category ||
                'Skill',

            status,

            progress,

            priority:
                node.data?.priority ||
                'medium'
        }
    };
}


function normalizeEdge(edge) {

    return {
        ...edge,

        id: String(edge.id),

        source:
            edge.source ||
            edge.source_node_id,

        target:
            edge.target ||
            edge.target_node_id,

        type:
            edge.type ||
            'smoothstep'
    };
}


function calculateReadiness(nodes) {

    if (!nodes.length) {
        return 0;
    }

    const total =
        nodes.reduce(
            (sum, node) =>
                sum +
                Number(
                    node.data?.progress || 0
                ),
            0
        );

    return Math.round(
        total / nodes.length
    );
}


function getStatusCounts(nodes) {

    return nodes.reduce(
        (counts, node) => {

            const status =
                node.data?.status ||
                'available';

            counts[status] =
                (counts[status] || 0) + 1;

            return counts;

        },
        {}
    );
}


function getNextNode(nodes) {

    const candidates =
        nodes.filter(
            node =>
                node.data?.status ===
                'available'
        );

    if (!candidates.length) {
        return null;
    }

    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };

    return [...candidates].sort(
        (a, b) =>
            (priorityOrder[a.data?.priority] || 2) -
            (priorityOrder[b.data?.priority] || 2)
    )[0];
}


export default function Roadmap() {

    const [nodes, setNodes, onNodesChange] =
        useNodesState([]);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState([]);

    const [roadmap, setRoadmap] =
        useState(null);

    const [analysis, setAnalysis] =
        useState(null);

    const [versions, setVersions] =
        useState([]);

    const [activeFilter, setActiveFilter] =
        useState('all');

    const [loading, setLoading] =
        useState(true);

    const [optimizing, setOptimizing] =
        useState(false);

    const [generating, setGenerating] =
        useState(false);

    const [error, setError] =
        useState('');

    const [selectedNode, setSelectedNode] =
        useState(null);


    /*
     * ========================================================
     * LOAD ROADMAP
     * ========================================================
     */

    const loadRoadmap = useCallback(
        async () => {

            try {

                setLoading(true);
                setError('');

                const data =
                    await api('/roadmap/me');

                setRoadmap(
                    data.roadmap || null
                );

                setAnalysis(
                    data.analysis || null
                );

                setNodes(
                    (data.nodes || []).map(
                        normalizeNode
                    )
                );

                setEdges(
                    (data.edges || []).map(
                        normalizeEdge
                    )
                );

            } catch (err) {

                console.error(
                    'Roadmap load error:',
                    err
                );

                setError(
                    err.message ||
                    'Unable to load roadmap.'
                );

            } finally {

                setLoading(false);

            }

        },
        [
            setNodes,
            setEdges
        ]
    );


    /*
     * ========================================================
     * LOAD ROADMAP VERSIONS
     * ========================================================
     */

    const loadVersions = useCallback(
        async () => {

            try {

                const data =
                    await api(
                        '/roadmap/me/versions'
                    );

                setVersions(
                    data.versions || []
                );

            } catch (err) {

                console.error(
                    'Version loading error:',
                    err
                );

            }

        },
        []
    );


    useEffect(
        () => {

            loadRoadmap();
            loadVersions();

        },
        [
            loadRoadmap,
            loadVersions
        ]
    );


    /*
     * ========================================================
     * GENERATE ROADMAP
     * ========================================================
     */

    const generateRoadmap =
        async () => {

            try {

                setGenerating(true);
                setError('');

                const data =
                    await api(
                        '/roadmap/generate',
                        {
                            method: 'POST'
                        }
                    );

                setRoadmap(
                    data.roadmap
                );

                setAnalysis(
                    data.analysis ||
                    null
                );

                setNodes(
                    (data.nodes || []).map(
                        normalizeNode
                    )
                );

                setEdges(
                    (data.edges || []).map(
                        normalizeEdge
                    )
                );

                await loadVersions();

            } catch (err) {

                console.error(
                    'Roadmap generation error:',
                    err
                );

                setError(
                    err.message ||
                    'Unable to generate roadmap.'
                );

            } finally {

                setGenerating(false);

            }

        };


    /*
     * ========================================================
     * OPTIMIZE ROADMAP
     * ========================================================
     */

    const optimizeRoadmap =
        async () => {

            try {

                setOptimizing(true);
                setError('');

                const data =
                    await api(
                        '/roadmap/optimize',
                        {
                            method: 'POST'
                        }
                    );

                setRoadmap(
                    data.roadmap
                );

                setAnalysis(
                    data.analysis ||
                    null
                );

                setNodes(
                    (data.nodes || []).map(
                        normalizeNode
                    )
                );

                setEdges(
                    (data.edges || []).map(
                        normalizeEdge
                    )
                );

                await loadVersions();

            } catch (err) {

                console.error(
                    'Roadmap optimization error:',
                    err
                );

                setError(
                    err.message ||
                    'Unable to optimize roadmap.'
                );

            } finally {

                setOptimizing(false);

            }

        };


    /*
     * ========================================================
     * FILTER NODES
     * ========================================================
     */

    const filteredNodes =
        useMemo(
            () => {

                if (
                    activeFilter ===
                    'all'
                ) {
                    return nodes;
                }

                return nodes.filter(
                    node =>
                        node.data?.status ===
                        activeFilter
                );

            },
            [
                nodes,
                activeFilter
            ]
        );


    /*
     * Keep prerequisite edges visible only when both nodes
     * are visible.
     */
    const filteredEdges =
        useMemo(
            () => {

                const visibleIds =
                    new Set(
                        filteredNodes.map(
                            node => node.id
                        )
                    );

                return edges.filter(
                    edge =>
                        visibleIds.has(
                            edge.source
                        ) &&
                        visibleIds.has(
                            edge.target
                        )
                );

            },
            [
                filteredNodes,
                edges
            ]
        );


    const readiness =
        analysis?.careerReadiness ??
        calculateReadiness(nodes);


    const statusCounts =
        getStatusCounts(nodes);


    const nextNode =
        getNextNode(nodes);


    /*
     * ========================================================
     * NODE CLICK
     * ========================================================
     */

    const onNodeClick =
        useCallback(
            (event, node) => {

                setSelectedNode(node);

            },
            []
        );


    /*
     * ========================================================
     * LOADING
     * ========================================================
     */

    if (loading) {

        return (
            <div className="roadmap-page">

                <div className="roadmap-loading">

                    <div className="roadmap-spinner" />

                    <h2>
                        Building your roadmap
                    </h2>

                    <p>
                        Loading your personalized
                        career path...
                    </p>

                </div>

            </div>
        );

    }


    /*
     * ========================================================
     * ERROR
     * ========================================================
     */

    if (error && !nodes.length) {

        return (
            <div className="roadmap-page">

                <div className="roadmap-empty">

                    <div className="roadmap-empty-icon">
                        !
                    </div>

                    <h2>
                        Roadmap unavailable
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="roadmap-primary-button"
                        onClick={loadRoadmap}
                    >
                        Retry
                    </button>

                </div>

            </div>
        );

    }


    /*
     * ========================================================
     * EMPTY ROADMAP
     * ========================================================
     */

    if (!nodes.length) {

        return (
            <div className="roadmap-page">

                <div className="roadmap-empty">

                    <div className="roadmap-empty-icon">
                        ✦
                    </div>

                    <h2>
                        Your career roadmap is ready
                    </h2>

                    <p>
                        Generate a personalized roadmap
                        based on your skills, target role,
                        assessments and available time.
                    </p>

                    <button
                        className="roadmap-primary-button"
                        onClick={generateRoadmap}
                        disabled={generating}
                    >
                        {generating
                            ? 'Generating...'
                            : 'Generate Roadmap'
                        }
                    </button>

                </div>

            </div>
        );

    }


    return (
        <div className="roadmap-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="roadmap-header">

                <div>

                    <div className="roadmap-eyebrow">
                        PERSONALIZED CAREER PLAN
                    </div>

                    <h1>
                        {roadmap?.target_role ||
                            'Career Roadmap'
                        }
                    </h1>

                    <p>
                        A skill path generated from
                        your current capabilities,
                        goals and career timeline.
                    </p>

                </div>


                <div className="roadmap-actions">

                    <button
                        className="roadmap-secondary-button"
                        onClick={generateRoadmap}
                        disabled={generating}
                    >
                        {generating
                            ? 'Generating...'
                            : '↻ Regenerate'
                        }
                    </button>

                    <button
                        className="roadmap-ai-button"
                        onClick={optimizeRoadmap}
                        disabled={optimizing}
                    >
                        <span>
                            ✦
                        </span>

                        {optimizing
                            ? 'Optimizing...'
                            : 'AI Optimize'
                        }
                    </button>

                </div>

            </header>


            {/* =================================================
                ERROR BANNER
            ================================================= */}

            {error && (
                <div className="roadmap-error">
                    {error}
                </div>
            )}


            {/* =================================================
                METRICS
            ================================================= */}

            <section className="roadmap-metrics">

                <div className="roadmap-metric-card">

                    <div className="metric-label">
                        Career readiness
                    </div>

                    <div className="metric-value">
                        {readiness}%
                    </div>

                    <div className="metric-progress">

                        <span
                            style={{
                                width: `${readiness}%`
                            }}
                        />

                    </div>

                </div>


                <div className="roadmap-metric-card">

                    <div className="metric-label">
                        Skills completed
                    </div>

                    <div className="metric-value">
                        {statusCounts.completed || 0}
                        <span className="metric-small">
                            / {nodes.length}
                        </span>
                    </div>

                    <div className="metric-description">
                        Keep building momentum.
                    </div>

                </div>


                <div className="roadmap-metric-card">

                    <div className="metric-label">
                        Next milestone
                    </div>

                    <div className="metric-value metric-title">
                        {nextNode?.data?.title ||
                            'All caught up'
                        }
                    </div>

                    <div className="metric-description">
                        {nextNode
                            ? `${nextNode.data.progress || 0}% complete`
                            : 'Your roadmap is complete.'
                        }
                    </div>

                </div>


                <div className="roadmap-metric-card">

                    <div className="metric-label">
                        Roadmap version
                    </div>

                    <div className="metric-value">
                        v{roadmap?.version || 1}
                    </div>

                    <div className="metric-description">
                        {roadmap?.source || 'system'}
                    </div>

                </div>

            </section>


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="roadmap-toolbar">

                <div className="roadmap-filters">

                    {STATUS_FILTERS.map(
                        filter => (

                            <button
                                key={filter.id}
                                className={
                                    activeFilter === filter.id
                                        ? 'roadmap-filter active'
                                        : 'roadmap-filter'
                                }
                                onClick={() =>
                                    setActiveFilter(
                                        filter.id
                                    )
                                }
                            >
                                {filter.label}

                                {filter.id !== 'all' && (
                                    <span>
                                        {statusCounts[
                                            filter.id
                                        ] || 0}
                                    </span>
                                )}

                            </button>

                        )
                    )}

                </div>


                <div className="roadmap-version">

                    {versions.length > 0 && (
                        <>
                            <span>
                                {versions.length}
                                {' '}
                                version
                                {versions.length !== 1
                                    ? 's'
                                    : ''
                                }
                            </span>

                            <span className="version-dot">
                                •
                            </span>

                            <span>
                                Live roadmap
                            </span>
                        </>
                    )}

                </div>

            </div>


            {/* =================================================
                MAIN WORKSPACE
            ================================================= */}

            <section className="roadmap-workspace">

                <div className="roadmap-canvas">

                    <ReactFlow
                        nodes={filteredNodes}
                        edges={filteredEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{
                            padding: 0.18
                        }}
                        minZoom={0.25}
                        maxZoom={1.5}
                        defaultEdgeOptions={{
                            animated: false,
                            style: {
                                strokeWidth: 2
                            }
                        }}
                    >

                        <Background
                            gap={24}
                            size={1}
                        />

                        <MiniMap
                            pannable
                            zoomable
                        />

                        <Controls />

                    </ReactFlow>

                </div>


                {/* =================================================
                    INSIGHT PANEL
                ================================================= */}

                <aside className="roadmap-insight-panel">

                    <div className="insight-header">

                        <div className="ai-badge">
                            ✦ AI
                        </div>

                        <div>

                            <h2>
                                Roadmap insight
                            </h2>

                            <p>
                                Personalized guidance
                            </p>

                        </div>

                    </div>


                    <div className="insight-section">

                        <div className="insight-label">
                            WHERE AM I?
                        </div>

                        <div className="insight-readiness">

                            <div
                                className="readiness-ring"
                                style={{
                                    '--readiness':
                                        `${readiness * 3.6}deg`
                                }}
                            >
                                <span>
                                    {readiness}%
                                </span>
                            </div>

                            <div>

                                <strong>
                                    Career readiness
                                </strong>

                                <p>
                                    {readiness >= 80
                                        ? 'You are approaching strong job readiness.'
                                        : readiness >= 50
                                            ? 'You have a solid foundation. Close the remaining gaps.'
                                            : 'You are building the foundations needed for your target role.'
                                    }
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="insight-section">

                        <div className="insight-label">
                            WHAT NEXT?
                        </div>

                        {nextNode ? (

                            <button
                                className="next-node-card"
                                onClick={() =>
                                    setSelectedNode(
                                        nextNode
                                    )
                                }
                            >

                                <span className="next-node-number">
                                    →
                                </span>

                                <span>

                                    <strong>
                                        {nextNode.data.title}
                                    </strong>

                                    <small>
                                        {nextNode.data.category}
                                        {' · '}
                                        {nextNode.data.progress || 0}%
                                    </small>

                                </span>

                            </button>

                        ) : (

                            <div className="insight-complete">
                                ✓ Roadmap complete
                            </div>

                        )}

                    </div>


                    <div className="insight-section">

                        <div className="insight-label">
                            WHY AI RECOMMENDS IT
                        </div>

                        <div className="reason-card">

                            <div className="reason-icon">
                                ✦
                            </div>

                            <p>
                                {roadmap?.optimization_summary ||
                                    roadmap?.ai_reasoning ||
                                    'The roadmap prioritizes prerequisite skills and closes the largest gaps toward your target role.'
                                }
                            </p>

                        </div>

                    </div>


                    {analysis && (
                        <div className="insight-section">

                            <div className="insight-label">
                                TIME FEASIBILITY
                            </div>

                            <div className={
                                analysis.feasible
                                    ? 'feasibility-card feasible'
                                    : 'feasibility-card warning'
                            }>

                                <strong>
                                    {analysis.feasible
                                        ? 'On track'
                                        : 'Timeline needs attention'
                                    }
                                </strong>

                                <p>
                                    Estimated workload:
                                    {' '}
                                    {analysis.totalHours || 0}
                                    {' '}
                                    hours
                                </p>

                                <p>
                                    Approx.
                                    {' '}
                                    {analysis.requiredWeeks || 0}
                                    {' '}
                                    weeks
                                </p>

                            </div>

                        </div>
                    )}


                    {selectedNode && (

                        <div className="selected-node-panel">

                            <div className="selected-node-top">

                                <div>

                                    <span className="insight-label">
                                        SELECTED
                                    </span>

                                    <h3>
                                        {selectedNode.data.title}
                                    </h3>

                                </div>

                                <button
                                    onClick={() =>
                                        setSelectedNode(null)
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <div className="selected-node-meta">

                                <span>
                                    {selectedNode.data.category}
                                </span>

                                <span>
                                    {selectedNode.data.status}
                                </span>

                            </div>

                            <div className="selected-progress">

                                <div className="selected-progress-bar">

                                    <span
                                        style={{
                                            width:
                                                `${selectedNode.data.progress || 0}%`
                                        }}
                                    />

                                </div>

                                <span>
                                    {selectedNode.data.progress || 0}%
                                </span>

                            </div>

                        </div>

                    )}

                </aside>

            </section>

        </div>
    );
}