import React from 'react';

const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        inactive: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
        archived: 'bg-gray-100 text-gray-500',
        expired: 'bg-gray-100 text-gray-500',
        accepted: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
    };

    const icons = {
        active: '🟢',
        pending: '🟡',
        inactive: '🔴',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {icons[status] && <span>{icons[status]}</span>}
            {status}
        </span>
    );
};

export default StatusBadge;
