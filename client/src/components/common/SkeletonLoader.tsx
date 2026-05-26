"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  type?: "card" | "list" | "table" | "detail" | "grid";
  count?: number;
  className?: string;
}

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const CardSkeleton = () => (
  <motion.div
    variants={itemVariants}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
  >
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  </motion.div>
);

const ListSkeleton = () => (
  <motion.div
    variants={itemVariants}
    className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg"
  >
    <div className="animate-pulse flex-1">
      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="animate-pulse flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
    <div className="animate-pulse">
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </motion.div>
);

const TableSkeleton = () => (
  <motion.tr variants={itemVariants} className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </td>
  </motion.tr>
);

const DetailSkeleton = () => (
  <motion.div
    variants={itemVariants}
    className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6"
  >
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="md:w-2/3 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="flex gap-4 pt-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    </div>
  </motion.div>
);

const GridSkeleton = ({ count = 6 }: { count: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

const SkeletonLoader = ({
  type = "card",
  count = 4,
  className = "",
}: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return <CardSkeleton />;
      case "list":
        return <ListSkeleton />;
      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: count }).map((_, i) => (
                  <TableSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        );
      case "detail":
        return <DetailSkeleton />;
      case "grid":
        return <GridSkeleton count={count} />;
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={skeletonVariants}
      className={className}
    >
      {type === "grid" ? (
        renderSkeleton()
      ) : (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i}>{renderSkeleton()}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SkeletonLoader;
