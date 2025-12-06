/**
 * Notification Messages Generator
 * Generates role-appropriate notification messages for different actions
 */

export const notificationMessages = {
  // Client Actions
  clients: {
    create: (role, clientName) => {
      const messages = {
        receptionist: `✅ Client "${clientName}" has been successfully created and added to your client list.`,
        admin: `✅ New client "${clientName}" has been added to the system.`,
      };
      return messages[role] || messages.admin;
    },
    update: (role, clientName) => {
      const messages = {
        receptionist: `✅ Client "${clientName}" information has been successfully updated.`,
        admin: `✅ Client "${clientName}" details have been modified.`,
      };
      return messages[role] || messages.admin;
    },
    delete: (role, clientName) => {
      const messages = {
        receptionist: `🗑️ Client "${clientName}" has been removed from the system.`,
        admin: `🗑️ Client "${clientName}" and all associated data have been deleted.`,
      };
      return messages[role] || messages.admin;
    },
  },

  // Order Actions
  orders: {
    create: (role, orderNumber) => {
      const messages = {
        admin: `✅ Order #${orderNumber} has been successfully created.`,
        designer: `📋 New order #${orderNumber} is now available for design.`,
        worker: `🔧 New order #${orderNumber} is ready for production.`,
        financial: `💰 New order #${orderNumber} has been added to financial records.`,
      };
      return messages[role] || messages.admin;
    },
    update: (role, orderNumber) => {
      const messages = {
        admin: `✅ Order #${orderNumber} has been updated.`,
        designer: `✏️ Design details for order #${orderNumber} have been modified.`,
        worker: `🔄 Production details for order #${orderNumber} have been updated.`,
        financial: `💰 Financial details for order #${orderNumber} have been modified.`,
      };
      return messages[role] || messages.admin;
    },
    statusChange: (role, orderNumber, newStatus) => {
      const statusEmoji = {
        pending: '⏳',
        active: '🔄',
        done: '✅',
        delivered: '📦',
      };
      const messages = {
        admin: `${statusEmoji[newStatus]} Order #${orderNumber} status changed to "${newStatus}".`,
        designer: `${statusEmoji[newStatus]} Order #${orderNumber} moved to "${newStatus}" stage.`,
        worker: `${statusEmoji[newStatus]} Order #${orderNumber} is now "${newStatus}".`,
        financial: `${statusEmoji[newStatus]} Order #${orderNumber} status updated to "${newStatus}".`,
      };
      return messages[role] || messages.admin;
    },
    delete: (role, orderNumber) => {
      const messages = {
        admin: `🗑️ Order #${orderNumber} has been permanently deleted.`,
      };
      return messages[role] || messages.admin;
    },
  },

  // Invoice Actions
  invoices: {
    create: (role, invoiceNumber) => {
      const messages = {
        admin: `✅ Invoice #${invoiceNumber} has been generated successfully.`,
        financial: `💼 New invoice #${invoiceNumber} has been created and is ready for processing.`,
      };
      return messages[role] || messages.admin;
    },
    update: (role, invoiceNumber) => {
      const messages = {
        admin: `✅ Invoice #${invoiceNumber} has been updated.`,
        financial: `💰 Invoice #${invoiceNumber} details have been modified.`,
      };
      return messages[role] || messages.admin;
    },
    delete: (role, invoiceNumber) => {
      const messages = {
        admin: `🗑️ Invoice #${invoiceNumber} has been deleted from the system.`,
        financial: `🗑️ Invoice #${invoiceNumber} has been removed from records.`,
      };
      return messages[role] || messages.admin;
    },
    statusChange: (role, invoiceNumber, newStatus) => {
      const messages = {
        admin: `✅ Invoice #${invoiceNumber} status changed to "${newStatus}".`,
        financial: `💰 Invoice #${invoiceNumber} marked as "${newStatus}".`,
      };
      return messages[role] || messages.admin;
    },
  },

  // User Management Actions
  users: {
    create: (role, username, userRole) => {
      return `✅ New ${userRole} account "${username}" has been created successfully.`;
    },
    update: (role, username) => {
      return `✅ User "${username}" profile has been updated.`;
    },
    delete: (role, username) => {
      return `🗑️ User "${username}" has been removed from the system.`;
    },
    activate: (role, username) => {
      return `✅ User "${username}" account has been activated.`;
    },
    deactivate: (role, username) => {
      return `⏸️ User "${username}" account has been deactivated.`;
    },
  },

  // Material Management Actions
  materials: {
    create: (role, materialName) => {
      const messages = {
        admin: `✅ Material "${materialName}" has been added to inventory.`,
        designer: `📦 New material "${materialName}" is now available for designs.`,
        worker: `🔧 Material "${materialName}" added to production materials.`,
      };
      return messages[role] || messages.admin;
    },
    update: (role, materialName) => {
      const messages = {
        admin: `✅ Material "${materialName}" details have been updated.`,
        designer: `📝 Material "${materialName}" specifications have been modified.`,
      };
      return messages[role] || messages.admin;
    },
    delete: (role, materialName) => {
      return `🗑️ Material "${materialName}" has been removed from inventory.`;
    },
    withdrawal: (role, materialName, quantity) => {
      const messages = {
        admin: `📤 ${quantity} units of "${materialName}" withdrawn from inventory.`,
        worker: `🔧 You have withdrawn ${quantity} units of "${materialName}".`,
        designer: `📦 ${quantity} units of "${materialName}" have been withdrawn.`,
      };
      return messages[role] || messages.admin;
    },
  },

  // Supplier Actions
  suppliers: {
    create: (role, supplierName) => {
      return `✅ Supplier "${supplierName}" has been added to the system.`;
    },
    update: (role, supplierName) => {
      return `✅ Supplier "${supplierName}" information has been updated.`;
    },
    delete: (role, supplierName) => {
      return `🗑️ Supplier "${supplierName}" has been removed from the system.`;
    },
  },

  // Purchase Actions
  purchases: {
    create: (role, purchaseNumber) => {
      return `✅ Purchase order #${purchaseNumber} has been created successfully.`;
    },
    update: (role, purchaseNumber) => {
      return `✅ Purchase order #${purchaseNumber} has been updated.`;
    },
    delete: (role, purchaseNumber) => {
      return `🗑️ Purchase order #${purchaseNumber} has been deleted.`;
    },
    receive: (role, purchaseNumber) => {
      return `📦 Purchase order #${purchaseNumber} has been received and inventory updated.`;
    },
  },

  // Report Actions
  reports: {
    export: (role, reportType) => {
      const messages = {
        admin: `📄 ${reportType} report has been exported successfully.`,
        financial: `💼 ${reportType} financial report exported.`,
        receptionist: `📋 ${reportType} client report exported.`,
      };
      return messages[role] || messages.admin;
    },
  },

  // General Actions
  general: {
    saveSuccess: () => `✅ Changes have been saved successfully.`,
    saveError: () => `❌ Failed to save changes. Please try again.`,
    loadError: () => `❌ Failed to load data. Please refresh the page.`,
    unauthorized: () => `🔒 You don't have permission to perform this action.`,
    networkError: () => `🌐 Network error. Please check your connection and try again.`,
  },

  // Website Settings
  website: {
    updateSettings: () => `✅ Website settings have been updated successfully.`,
    updateGallery: () => `🖼️ Gallery has been updated successfully.`,
    updateContact: () => `📞 Contact information has been updated.`,
  },
};

/**
 * Get notification message based on action, role, and parameters
 * @param {string} category - Category of action (clients, orders, invoices, etc.)
 * @param {string} action - Specific action (create, update, delete, etc.)
 * @param {string} role - User role
 * @param {object} params - Additional parameters for the message
 * @returns {string} Formatted notification message
 */
export const getNotificationMessage = (category, action, role, params = {}) => {
  try {
    const categoryMessages = notificationMessages[category];
    if (!categoryMessages) {
      return notificationMessages.general.saveSuccess();
    }

    const actionMessage = categoryMessages[action];
    if (typeof actionMessage === 'function') {
      return actionMessage(role, ...Object.values(params));
    }

    return notificationMessages.general.saveSuccess();
  } catch (error) {
    console.error('Error generating notification message:', error);
    return notificationMessages.general.saveSuccess();
  }
};
