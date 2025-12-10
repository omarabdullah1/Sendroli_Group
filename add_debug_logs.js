
const fs = require('fs');

const topHeaderPath = '/Users/root1/Sendroli_Group/frontend/src/components/TopHeader/TopHeader.jsx';
const sidebarPath = '/Users/root1/Sendroli_Group/frontend/src/components/Sidebar/Sidebar.jsx';
const sidebarContextPath = '/Users/root1/Sendroli_Group/frontend/src/context/SidebarContext.jsx';

// Add log to TopHeader
let topHeaderContent = fs.readFileSync(topHeaderPath, 'utf8');
if (!topHeaderContent.includes('console.log(\'Toggle sidebar clicked\')')) {
    topHeaderContent = topHeaderContent.replace(
        'const { toggleSidebar, isOpen } = useSidebar();',
        'const { toggleSidebar, isOpen } = useSidebar();\n  console.log(\'TopHeader rendered, isOpen:\', isOpen);'
    );
    topHeaderContent = topHeaderContent.replace(
        'onClick={toggleSidebar}',
        'onClick={() => { console.log(\'Toggle sidebar clicked\'); toggleSidebar(); }}'
    );
    fs.writeFileSync(topHeaderPath, topHeaderContent);
    console.log('Added logs to TopHeader.jsx');
}

// Add log to Sidebar
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
if (!sidebarContent.includes('console.log(\'Sidebar rendered, isOpen:\', isOpen)')) {
    sidebarContent = sidebarContent.replace(
        'const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();',
        'const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();\n  console.log(\'Sidebar rendered, isOpen:\', isOpen);'
    );
    fs.writeFileSync(sidebarPath, sidebarContent);
    console.log('Added logs to Sidebar.jsx');
}

// Add log to SidebarContext
let sidebarContextContent = fs.readFileSync(sidebarContextPath, 'utf8');
if (!sidebarContextContent.includes('console.log(\'toggleSidebar called, new state:\', !prev)')) {
    sidebarContextContent = sidebarContextContent.replace(
        'setIsOpen(prev => !prev);',
        'setIsOpen(prev => { console.log(\'toggleSidebar called, new state:\', !prev); return !prev; });'
    );
    fs.writeFileSync(sidebarContextPath, sidebarContextContent);
    console.log('Added logs to SidebarContext.jsx');
}
