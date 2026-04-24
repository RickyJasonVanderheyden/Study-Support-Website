const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // super_admin inherits all admin privileges
        const userRole = req.user.role;
        const hasAccess = allowedRoles.includes(userRole) ||
            (userRole === 'super_admin' && allowedRoles.includes('admin'));

        if (!hasAccess) {
            return res.status(403).json({
                error: 'Unauthorized access',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = roleMiddleware;
