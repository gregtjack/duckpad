"use client";

import { useState, useEffect } from "react";
import { Dataset, useCatalogStore } from "@/store/catalog-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Hash,
  Calendar,
  Binary,
  List,
  HelpCircle,
  ClockIcon,
  TypeIcon,
  TableIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { useDuckDBStore } from "@/store/duckdb-store";
import { Separator } from "../ui/separator";

interface DatasetDetailsDialogProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SchemaColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
}

const getDataTypeIcon = (dataType: string, iconSize: number = 12) => {
  const lowerType = dataType.toLowerCase();

  if (
    lowerType.includes("int") ||
    lowerType.includes("float") ||
    lowerType.includes("double") ||
    lowerType.includes("decimal")
  ) {
    return <Hash size={iconSize} />;
  }
  if (lowerType.includes("date")) {
    return <Calendar size={iconSize} />;
  }
  if (lowerType.includes("timestamp")) {
    return <ClockIcon size={iconSize} />;
  }
  if (lowerType.includes("varchar") || lowerType.includes("text") || lowerType.includes("char")) {
    return <TypeIcon size={iconSize} />;
  }
  if (lowerType.includes("blob") || lowerType.includes("binary")) {
    return <Binary size={iconSize} />;
  }
  if (lowerType.includes("array") || lowerType.includes("list")) {
    return <List size={iconSize} />;
  }

  return <HelpCircle size={iconSize} />;
};

function formatNumber(num: number | bigint): string {
  return num.toString();
}

export function DatasetDetailsDialog({ dataset, isOpen, onClose }: DatasetDetailsDialogProps) {
  const getTableSchema = useCatalogStore(state => state.getTableSchema);
  const removeDataset = useCatalogStore(state => state.removeDataset);
  const exportTable = useDuckDBStore(state => state.exportTable);

  const [schema, setSchema] = useState<SchemaColumn[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDelete = async () => {
    if (!dataset?.id) return;
    setIsDeleting(true);
    await removeDataset(dataset?.id);
    setIsDeleting(false);
    setShowDeleteConfirmation(false);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleExport = async (format: "csv" | "parquet" | "json") => {
    if (!dataset?.tableName) return;
    const url = await exportTable(dataset.tableName, format);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table_${dataset.tableName}.${format}`;
    a.click();
  };

  useEffect(() => {
    if (isOpen && dataset) {
      setIsLoadingSchema(true);
      getTableSchema(dataset.tableName)
        .then(setSchema)
        .catch(console.error)
        .finally(() => setIsLoadingSchema(false));
    }
  }, [isOpen, dataset, getTableSchema]);

  if (!dataset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="size-5" />
            {dataset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Table Name</h4>
              <p className="text-sm font-mono truncate">{dataset.tableName}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
              <p className="text-sm">In-memory</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
              <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                {dataset.fileType}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Rows</h4>
              <p className="text-sm">
                {dataset.rowCount !== undefined ? formatNumber(dataset.rowCount) : "Unknown"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">
                {dataset.createdAt.toLocaleDateString()} {dataset.createdAt.toLocaleTimeString()}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Access</h4>
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  dataset.isInsertable
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {dataset.isInsertable ? "Insertable" : "Read-only"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Schema</h4>
            {isLoadingSchema ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading schema...</span>
              </div>
            ) : schema.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nullable</TableHead>
                      <TableHead>Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.map(column => (
                      <TableRow key={column.columnName}>
                        <TableCell>{getDataTypeIcon(column.dataType)}</TableCell>
                        <TableCell className="font-mono text-sm">{column.columnName}</TableCell>
                        <TableCell className="font-mono text-sm">{column.dataType}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                              column.isNullable === "YES"
                                ? "border bg-background"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {column.isNullable === "YES" ? "NULL" : "NOT NULL"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {column.columnDefault || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No schema information available
              </div>
            )}

            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Export</h4>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="secondary" onClick={() => handleExport("csv")}>
                  Export to CSV
                  <DownloadIcon />
                </Button>
                <Button variant="secondary" onClick={() => handleExport("parquet")}>
                  Export to Parquet
                  <DownloadIcon />
                </Button>
                <Button variant="secondary" onClick={() => handleExport("json")}>
                  Export to JSON
                  <DownloadIcon />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Note: large tables may take a while to export, and in some cases will cause DuckDB
                to OOM.
              </span>
            </div>
            <Separator />
            <Button variant="destructive" onClick={handleDeleteClick} disabled={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the dataset "{dataset?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
