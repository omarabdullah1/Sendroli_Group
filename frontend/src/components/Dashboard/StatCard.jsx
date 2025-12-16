import { faArrowDown, faArrowUp, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DashboardCard from './DashboardCard';

const StatCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    trendLabel = 'vs last month',
    loading = false,
    color = 'blue' // text-blue-600, etc.
}) => {
    if (loading) {
        return (
            <DashboardCard>
                <div className="animate-pulse flex justify-between items-start">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                </div>
            </DashboardCard>
        );
    }

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-500 bg-green-50';
        if (trend === 'down') return 'text-red-500 bg-red-50';
        return 'text-gray-500 bg-gray-50';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return faArrowUp;
        if (trend === 'down') return faArrowDown;
        return faMinus;
    };

    const getColorGradient = () => {
        const colorMap = {
            'blue': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            'purple': 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
            'green': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'emerald': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'orange': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            'amber': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'red': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            'pink': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            'indigo': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            'cyan': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            'teal': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        };
        return colorMap[color] || colorMap['blue'];
    };

    const getColorShadow = () => {
        const shadowMap = {
            'blue': '0 10px 30px -5px rgba(59, 130, 246, 0.3)',
            'purple': '0 10px 30px -5px rgba(168, 85, 247, 0.3)',
            'green': '0 10px 30px -5px rgba(16, 185, 129, 0.3)',
            'emerald': '0 10px 30px -5px rgba(16, 185, 129, 0.3)',
            'orange': '0 10px 30px -5px rgba(249, 115, 22, 0.3)',
            'amber': '0 10px 30px -5px rgba(245, 158, 11, 0.3)',
            'red': '0 10px 30px -5px rgba(239, 68, 68, 0.3)',
            'pink': '0 10px 30px -5px rgba(236, 72, 153, 0.3)',
            'indigo': '0 10px 30px -5px rgba(99, 102, 241, 0.3)',
            'cyan': '0 10px 30px -5px rgba(6, 182, 212, 0.3)',
            'teal': '0 10px 30px -5px rgba(20, 184, 166, 0.3)',
        };
        return shadowMap[color] || shadowMap['blue'];
    };

    return (
        <DashboardCard className="relative overflow-hidden group">
            {/* Accent gradient on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60"></div>

            <div className="flex justify-between items-start mb-5">
                <div className="flex-1 relative z-10">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                        {title}
                    </h3>
                    <div className="text-5xl font-extrabold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent tracking-tight leading-none mb-1">
                        {value}
                    </div>
                </div>
                <div
                    className="relative p-4 rounded-2xl text-white transition-all duration-500 ease-out group-hover:scale-125 group-hover:rotate-12"
                    style={{
                        background: getColorGradient(),
                        boxShadow: getColorShadow()
                    }}
                >
                    {icon && <FontAwesomeIcon icon={icon} className="w-7 h-7" />}
                    {/* Glare effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
            </div>

            {(trendValue || trendLabel) && (
                <div className="flex items-center text-sm mt-3 relative z-10 !gap-4">
                    <span className={`
                        !inline-flex !items-center !px-4 !py-1.5 !rounded-lg !text-xs !font-bold !mr-4
                        shadow-sm
                        ${getTrendColor()}
                        transition-all duration-300 hover:scale-105
                    `}>
                        <FontAwesomeIcon icon={getTrendIcon()} className="w-3.5 h-3.5 mr-2" />
                        {trendValue}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs tracking-wide truncate">
                        {trendLabel}
                    </span>
                </div>
            )}

            {/* Background decoration */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-gray-100/40 dark:to-gray-700/20 rounded-tl-full opacity-50 transition-opacity duration-300 group-hover:opacity-70"></div>
        </DashboardCard>
    );
};

export default StatCard;
