import { useState, useCallback } from 'react';

export const useSearch = (data, searchFields = ['name', 'email', 'phone_number']) => {
    const [query, setQuery] = useState('');

    const filteredData = useCallback(() => {
        if (!query || query.trim() === '') {
            return data;
        }

        const lowerQuery = query.toLowerCase().trim();

        return data.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                if (!value) return false;

                return String(value).toLowerCase().includes(lowerQuery);
            });
        });
    }, [data, query, searchFields]);

    const clearSearch = useCallback(() => {
        setQuery('');
    }, []);

    return {
        query,
        setQuery,
        filteredData: filteredData(),
        clearSearch,
        hasResults: filteredData().length > 0,
        resultsCount: filteredData().length,
    };
};
