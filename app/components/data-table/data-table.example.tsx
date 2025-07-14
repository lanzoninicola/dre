import { Plus } from "lucide-react";
import { ProjectSection, ColumnConfig, ModernDataTable } from "./data-table";

// Example Usage with TypeScript
const ExampleTable: React.FC = () => {
  const sampleData: ProjectSection[] = [
    {
      id: 1,
      header: "Cover page",
      sectionType: "Cover page",
      status: "in-progress",
      target: 18,
      limit: 5,
      reviewer: "Eddie Lake"
    },
    {
      id: 2,
      header: "Table of contents",
      sectionType: "Table of contents",
      status: "done",
      target: 29,
      limit: 24,
      reviewer: "Eddie Lake"
    },
    {
      id: 3,
      header: "Executive summary",
      sectionType: "Narrative",
      status: "done",
      target: 10,
      limit: 13,
      reviewer: "Eddie Lake"
    },
    {
      id: 4,
      header: "Technical approach",
      sectionType: "Narrative",
      status: "done",
      target: 27,
      limit: 23,
      reviewer: "Jamik Tashpulatov"
    },
    {
      id: 5,
      header: "Design",
      sectionType: "Narrative",
      status: "in-progress",
      target: 2,
      limit: 16,
      reviewer: "Jamik Tashpulatov"
    },
    {
      id: 6,
      header: "Capabilities",
      sectionType: "Narrative",
      status: "in-progress",
      target: 20,
      limit: 8,
      reviewer: "Jamik Tashpulatov"
    }
  ];

  const columns: ColumnConfig<ProjectSection>[] = [
    {
      key: "header",
      header: "Header",
      sortable: true
    },
    {
      key: "sectionType",
      header: "Section Type",
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {value}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      type: "status",
      sortable: true
    },
    {
      key: "target",
      header: "Target",
      sortable: true,
      className: "text-center"
    },
    {
      key: "limit",
      header: "Limit",
      sortable: true,
      className: "text-center"
    },
    {
      key: "reviewer",
      header: "Reviewer",
      type: "user",
      sortable: true
    }
  ];

  const handleRowClick = (item: ProjectSection): void => {
    console.log("Row clicked:", item);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ModernDataTable<ProjectSection>
        title="Project Sections"
        subtitle="Manage and track your project sections"
        data={sampleData}
        columns={columns}
        onRowClick={handleRowClick}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        }
      />
    </div>
  );
};

// Export components and types
export default ExampleTable;
