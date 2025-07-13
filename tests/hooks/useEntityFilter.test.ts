import { renderHook, act } from '@testing-library/react';
import { useEntityFilter } from '../../src/hooks/useEntityFilter';

// Mock data for testing
const mockBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', tags: ['classic', 'fiction'] },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', tags: ['classic', 'drama'] },
  { id: 3, title: '1984', author: 'George Orwell', tags: ['dystopian', 'sci-fi'] },
  { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', tags: ['romance', 'classic'] },
  { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', tags: ['coming-of-age'] },
];

describe('useEntityFilter', () => {
  describe('Basic Filtering', () => {
    it('should filter items by title field', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      // Set filter value
      act(() => {
        result.current.setFilter('great');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].title).toBe('The Great Gatsby');
    });

    it('should be case insensitive by default', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.setFilter('GREAT');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].title).toBe('The Great Gatsby');
    });

    it('should return all items when filter is empty', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      expect(result.current.filteredItems).toHaveLength(mockBooks.length);
    });

    it('should return all items when filter is below minimum length', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
          minCharacters: 4,
        })
      );

      act(() => {
        result.current.setFilter('ab');
      });

      expect(result.current.filteredItems).toHaveLength(mockBooks.length);
    });
  });

  describe('Multiple Search Fields', () => {
    it('should search across multiple fields', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title', 'author'],
        })
      );

      act(() => {
        result.current.setFilter('lee');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].author).toBe('Harper Lee');
    });

    it('should find matches in any specified field', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title', 'author'],
        })
      );

      act(() => {
        result.current.setFilter('orwell');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].title).toBe('1984');
    });
  });

  describe('Function-based Field Extraction', () => {
    it('should use function to extract field values', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: [
            (item: any) => item.title,
            (item: any) => item.author,
          ],
        })
      );

      act(() => {
        result.current.setFilter('gatsby');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].title).toBe('The Great Gatsby');
    });
  });

  describe('Filter State Management', () => {
    it('should manage filter state correctly', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      expect(result.current.filter).toBe('');

      act(() => {
        result.current.setFilter('test');
      });

      expect(result.current.filter).toBe('test');
    });

    it('should clear filter correctly', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.setFilter('test');
      });

      expect(result.current.filter).toBe('test');

      act(() => {
        result.current.clearFilter();
      });

      expect(result.current.filter).toBe('');
      expect(result.current.filteredItems).toHaveLength(mockBooks.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useEntityFilter([], {
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.setFilter('test');
      });

      expect(result.current.filteredItems).toHaveLength(0);
    });

    it('should handle null/undefined values gracefully', () => {
      const itemsWithNulls = [
        { id: 1, title: 'Valid Book', author: null },
        { id: 2, title: null, author: 'Valid Author' },
        { id: 3, title: undefined, author: undefined },
        { id: 4, title: 'Another Book', author: 'Another Author' },
      ];

      const { result } = renderHook(() =>
        useEntityFilter(itemsWithNulls, {
          searchFields: ['title', 'author'],
        })
      );

      act(() => {
        result.current.setFilter('valid');
      });

      expect(result.current.filteredItems.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom minimum characters', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
          minCharacters: 5,
        })
      );

      act(() => {
        result.current.setFilter('test');
      });

      // Should return all items since filter is below minimum
      expect(result.current.filteredItems).toHaveLength(mockBooks.length);

      act(() => {
        result.current.setFilter('gatsby');
      });

      // Should filter since filter meets minimum
      expect(result.current.filteredItems.length).toBeLessThan(mockBooks.length);
    });

    it('should respect case sensitivity setting', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
          caseSensitive: true,
        })
      );

      act(() => {
        result.current.setFilter('GREAT');
      });

      // Should find nothing with case-sensitive search
      expect(result.current.filteredItems).toHaveLength(0);

      act(() => {
        result.current.setFilter('Great');
      });

      // Should find match with correct case
      expect(result.current.filteredItems).toHaveLength(1);
    });
  });

  describe('Performance and Memoization', () => {
    it('should memoize results for same inputs', () => {
      const { result } = renderHook(() =>
        useEntityFilter(mockBooks, {
          searchFields: ['title'],
        })
      );

      act(() => {
        result.current.setFilter('great');
      });

      const firstResult = result.current.filteredItems;

      // Clear and set same filter again
      act(() => {
        result.current.clearFilter();
      });

      act(() => {
        result.current.setFilter('great');
      });

      // Should produce same result
      expect(result.current.filteredItems).toEqual(firstResult);
    });
  });
});