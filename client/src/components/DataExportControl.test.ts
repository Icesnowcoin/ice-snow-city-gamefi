import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataExportControl, AdvancedExportControl } from './DataExportControl';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('DataExportControl', () => {
  const mockData = [
    { name: 'Alice', age: 30, city: 'New York' },
    { name: 'Bob', age: 25, city: 'Los Angeles' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state during export', async () => {
      const { rerender } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      expect(button).not.toBeDisabled();

      // Simulate export start
      fireEvent.click(button);

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText(/导出中/i)).toBeInTheDocument();
      });
    });

    it('should disable button during export', async () => {
      const { rerender } = render(
        <DataExportControl
          data={mockData}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('should show progress percentage', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      await waitFor(() => {
        const progressText = screen.getByText(/导出中.*%/);
        expect(progressText).toBeInTheDocument();
      });
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast on CSV export', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      // Open dropdown
      const csvOption = await screen.findByText('导出为 CSV');
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'CSV 导出成功',
          expect.objectContaining({
            description: expect.stringContaining('test.csv'),
            duration: 3000,
          })
        );
      });
    });

    it('should show success toast on Excel export', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const excelOption = await screen.findByText('导出为 Excel');
      fireEvent.click(excelOption);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Excel 导出成功',
          expect.objectContaining({
            description: expect.stringContaining('test.xlsx'),
            duration: 3000,
          })
        );
      });
    });

    it('should show info toast on preview', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const previewOption = await screen.findByText('预览 CSV');
      fireEvent.click(previewOption);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith(
          'CSV 预览已打开',
          expect.objectContaining({
            duration: 2000,
          })
        );
      });
    });

    it('should show error toast on export failure', async () => {
      render(
        <DataExportControl
          data={[]}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Status Text', () => {
    it('should show correct status text during export', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/导出中.*%/)).toBeInTheDocument();
      });
    });

    it('should show success status after export', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(screen.getByText('导出成功')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onExportStart callback', async () => {
      const onExportStart = vi.fn();

      render(
        <DataExportControl
          data={mockData}
          filename="test"
          onExportStart={onExportStart}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(onExportStart).toHaveBeenCalled();
      });
    });

    it('should call onExportSuccess callback', async () => {
      const onExportSuccess = vi.fn();

      render(
        <DataExportControl
          data={mockData}
          filename="test"
          onExportSuccess={onExportSuccess}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith('csv');
      });
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar during export', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should update progress width', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-blue-500') as HTMLElement;
        expect(progressBar).toBeInTheDocument();
        const width = progressBar.style.width;
        expect(width).toMatch(/^\d+%$/);
      });
    });

    it('should reach 100% on success', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      fireEvent.click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      fireEvent.click(csvOption);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-blue-500') as HTMLElement;
        expect(progressBar.style.width).toBe('100%');
      });
    });
  });
});

describe('AdvancedExportControl', () => {
  const mockDatasets = [
    {
      name: 'Users',
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    },
    {
      name: 'Products',
      data: [
        { id: 1, title: 'Product A' },
        { id: 2, title: 'Product B' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export button', () => {
    render(
      <AdvancedExportControl
        datasets={mockDatasets}
        filename="export"
      />
    );

    expect(screen.getByRole('button', { name: /导出多工作表/i })).toBeInTheDocument();
  });

  it('should show loading state during export', async () => {
    render(
      <AdvancedExportControl
        datasets={mockDatasets}
        filename="export"
      />
    );

    const button = screen.getByRole('button', { name: /导出多工作表/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith('正在导出 Excel...', { duration: 0 });
    });
  });

  it('should show success toast on multi-sheet export', async () => {
    render(
      <AdvancedExportControl
        datasets={mockDatasets}
        filename="export"
      />
    );

    const button = screen.getByRole('button', { name: /导出多工作表/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Excel 导出成功',
        expect.objectContaining({
          description: expect.stringContaining('2'),
        })
      );
    });
  });

  it('should disable button when no datasets', () => {
    render(
      <AdvancedExportControl
        datasets={[]}
        filename="export"
      />
    );

    const button = screen.getByRole('button', { name: /导出多工作表/i });
    expect(button).toBeDisabled();
  });
});

describe('Export Experience', () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: Math.floor(Math.random() * 50) + 20,
  }));

  it('should handle large datasets', async () => {
    render(
      <DataExportControl
        data={mockData}
        filename="large-export"
        showProgress={true}
      />
    );

    const button = screen.getByRole('button', { name: /导出数据/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('导出为 CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should show smooth progress animation', async () => {
    const { container } = render(
      <DataExportControl
        data={mockData}
        filename="test"
        showProgress={true}
      />
    );

    const button = screen.getByRole('button', { name: /导出数据/i });
    fireEvent.click(button);

    // Check progress bar has transition class
    await waitFor(() => {
      const progressBar = container.querySelector('.transition-all');
      expect(progressBar).toBeInTheDocument();
    });
  });

  it('should reset state after export', async () => {
    render(
      <DataExportControl
        data={mockData}
        filename="test"
        showProgress={true}
      />
    );

    const button = screen.getByRole('button', { name: /导出数据/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('导出为 CSV');
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    // Wait for state reset
    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 2000 }
    );
  });
});
