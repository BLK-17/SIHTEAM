import {
    Handle,
    Position
} from '@xyflow/react';

import './roadmap.css';


const STATUS_CONFIG = {

    completed: {
        label: 'Completed',
        className: 'completed'
    },

    'in-progress': {
        label: 'In Progress',
        className: 'in-progress'
    },

    available: {
        label: 'Next',
        className: 'available'
    },

    locked: {
        label: 'Locked',
        className: 'locked'
    }

};


export default function RoadmapNode({
    data,
    type
}) {

    const status =
        data?.status ||
        'available';

    const config =
        STATUS_CONFIG[status] ||
        STATUS_CONFIG.available;

    const progress =
        Number(
            data?.progress || 0
        );


    return (
        <div
            className={
                `roadmap-node ${config.className} ${
                    type === 'project'
                        ? 'project-node'
                        : ''
                }`
            }
        >

            <Handle
                type="target"
                position={Position.Left}
                className="roadmap-handle"
            />


            <div className="node-top">

                <span className="node-category">
                    {data?.category || 'Skill'}
                </span>

                <span className="node-status">
                    {config.label}
                </span>

            </div>


            <div className="node-title">
                {data?.title || 'Skill'}
            </div>


            {data?.description && (
                <div className="node-description">
                    {data.description}
                </div>
            )}


            <div className="node-progress-row">

                <div className="node-progress">

                    <span
                        style={{
                            width: `${progress}%`
                        }}
                    />

                </div>

                <span className="node-progress-value">
                    {progress}%
                </span>

            </div>


            {data?.priority &&
                data.priority !== 'complete' && (
                    <div className="node-footer">

                        <span>
                            {data.priority === 'high'
                                ? 'High priority'
                                : data.priority === 'medium'
                                    ? 'Recommended'
                                    : 'Optional'
                            }
                        </span>

                        {data?.estimatedHours && (
                            <span>
                                {data.estimatedHours}h
                            </span>
                        )}

                    </div>
                )
            }


            <Handle
                type="source"
                position={Position.Right}
                className="roadmap-handle"
            />

        </div>
    );
}