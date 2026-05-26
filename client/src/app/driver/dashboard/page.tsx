"use client";

export default function DriverDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Driver Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Today&apos;s Orders</h2>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Completed Orders</h2>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Rating</h2>
            <p className="text-3xl font-bold">0.0 ⭐</p>
          </div>
        </div>
      </div>
    </div>
  );
}
