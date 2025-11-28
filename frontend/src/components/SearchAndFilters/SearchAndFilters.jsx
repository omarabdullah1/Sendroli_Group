import React from 'react';
import './SearchAndFilters.css';

/**
 * Reusable Search and Filters Component
 * Provides search input and filters for client, state, and date range
 * 
 * @param {Object} props
 * @param {string} props.searchValue - Current search value
 * @param {Function} props.onSearchChange - Handler for search input change
 * @param {Function} props.onSearch - Handler for search button click
 * @param {Array} props.clients - Array of clients for client filter dropdown
 * @param {string} props.selectedClient - Selected client ID
 * @param {Function} props.onClientChange - Handler for client filter change
 * @param {Array} props.states - Array of state options [{value: '', label: 'All States'}]
 * @param {string} props.selectedState - Selected state value
 * @param {Function} props.onStateChange - Handler for state filter change
 * @param {string} props.startDate - Start date for date range filter
 * @param {Function} props.onStartDateChange - Handler for start date change
 * @param {string} props.endDate - End date for date range filter
 * @param {Function} props.onEndDateChange - Handler for end date change
 * @param {Function} props.onClearFilters - Handler to clear all filters
 * @param {boolean} props.showClientFilter - Whether to show client filter (default: true)
 * @param {boolean} props.showStateFilter - Whether to show state filter (default: true)
 * @param {boolean} props.showDateFilter - Whether to show date filter (default: true)
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 */
const SearchAndFilters = ({
  searchValue = '',
  onSearchChange,
  onSearch,
  clients = [],
  selectedClient = '',
  onClientChange,
  states = [],
  selectedState = '',
  onStateChange,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  onClearFilters,
  showClientFilter = true,
  showStateFilter = true,
  showDateFilter = true,
  searchPlaceholder = 'Search...',
}) => {
  const hasActiveFilters = searchValue || selectedClient || selectedState || startDate || endDate;

  return (
    <div className="search-and-filters">
      <div className="filters-row">
        {/* Search Input */}
        <div className="filter-group search-group">
          <input
            type="text"
            className="search-input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch && onSearch()}
          />
          {onSearch && (
            <button className="search-btn" onClick={onSearch} type="button">
              Search
            </button>
          )}
        </div>

        {/* Client Filter */}
        {showClientFilter && clients.length > 0 && (
          <div className="filter-group">
            <label className="filter-label">Client</label>
            <select
              className="filter-select"
              value={selectedClient}
              onChange={(e) => onClientChange && onClientChange(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name || client.factoryName || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* State Filter */}
        {showStateFilter && states.length > 0 && (
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={selectedState}
              onChange={(e) => onStateChange && onStateChange(e.target.value)}
            >
              {states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Filter */}
        {showDateFilter && (
          <>
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                className="filter-date"
                value={startDate}
                onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                className="filter-date"
                value={endDate}
                onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && onClearFilters && (
          <div className="filter-group">
            <button className="clear-filters-btn" onClick={onClearFilters} type="button">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilters;

