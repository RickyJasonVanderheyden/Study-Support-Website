import React from 'react';

const RoleBadge = ({ role }) => {
    const styles = {
        leader: 'bg-indigo-100 text-indigo-800',
        member: 'bg-gray-100 text-gray-700',
    };

    const icons = {
        leader: '👑',
        member: '👤',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[role] || 'bg-gray-100 text-gray-600'}`}>
            <span>{icons[role]}</span>
            {role}
        </span>
    );
};

export default RoleBadge;
