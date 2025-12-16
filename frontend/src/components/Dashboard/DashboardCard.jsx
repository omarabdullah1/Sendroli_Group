
const DashboardCard = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`
                relative bg-white dark:bg-gray-800 
                rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50
                p-8 
                transition-all duration-500 ease-out
                hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.01] hover:-translate-y-1
                before:absolute before:inset-0 before:rounded-2xl 
                before:bg-gradient-to-br before:from-blue-50/50 before:via-transparent before:to-purple-50/30
                dark:before:from-blue-900/10 dark:before:via-transparent dark:before:to-purple-900/10
                before:opacity-0 before:transition-opacity before:duration-300
                hover:before:opacity-100
                backdrop-blur-sm
                ${className}
            `}
            style={{ marginBottom: '3rem' }}
            {...props}
        >
            {children}
        </div>
    );
};

export default DashboardCard;
