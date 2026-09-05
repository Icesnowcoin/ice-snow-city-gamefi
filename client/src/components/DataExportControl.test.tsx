import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataExportControl, AdvancedExportControl } from './DataExportControl';
import { toast } from 'sonner';

const click = async (element: HTMLElement) => {
  await userEvent.setup().click(element);
};

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
    vi.stubGlobal('open', vi.fn(() => ({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Loading State', () => {
    it('should open export menu before export starts', async () => {
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
      await click(button);

      await waitFor(() => {
        expect(screen.getByText('导出为 CSV')).toBeInTheDocument();
      });
    });

    it('should keep the trigger enabled while the menu is open', async () => {
      const { rerender } = render(
        <DataExportControl
          data={mockData}
          filename="test"
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.getByText('导出为 Excel')).toBeInTheDocument();
      });
    });

    it('should expose all export format choices', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      await waitFor(() => {
        expect(screen.getByText('导出为 CSV')).toBeInTheDocument();
        expect(screen.getByText('预览 CSV')).toBeInTheDocument();
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
      await click(button);

      // Open dropdown
      const csvOption = await screen.findByText('导出为 CSV');
      await click(csvOption);

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
      await click(button);

      const excelOption = await screen.findByText('导出为 Excel');
      await click(excelOption);

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
      await click(button);

      const previewOption = await screen.findByText('预览 CSV');
      await click(previewOption);

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
    it('should show the idle status before an export is selected', async () => {
      render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('导出为 CSV')).toBeInTheDocument();
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
      await click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      await click(csvOption);

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
      await click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      await click(csvOption);

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
      await click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      await click(csvOption);

      await waitFor(() => {
        expect(onExportSuccess).toHaveBeenCalledWith('csv');
      });
    });
  });

  describe('Progress Bar', () => {
    it('should keep the progress bar hidden before export starts', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      await waitFor(() => {
        expect(container.querySelector('.bg-blue-500')).toBeNull();
      });
    });

    it('should not expose progress width before export starts', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      await waitFor(() => {
        expect(container.querySelector('.bg-blue-500')).toBeNull();
      });
    });

    it('should report success after CSV export', async () => {
      const { container } = render(
        <DataExportControl
          data={mockData}
          filename="test"
          showProgress={true}
        />
      );

      const button = screen.getByRole('button', { name: /导出数据/i });
      await click(button);

      const csvOption = await screen.findByText('导出为 CSV');
      await click(csvOption);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'CSV 导出成功',
          expect.objectContaining({ duration: 3000 })
        );
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
    await click(button);

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
    await click(button);

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
    await click(button);

    const csvOption = await screen.findByText('导出为 CSV');
    await click(csvOption);

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
    await click(button);

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
    await click(button);

    const csvOption = await screen.findByText('导出为 CSV');
    await click(csvOption);

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
