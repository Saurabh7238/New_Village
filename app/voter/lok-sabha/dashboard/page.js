"use client";

import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  parseVoterListResponse,
  getVoterAge,
  classifyVoterGender,
} from "@/lib/voterDisplay";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
);

export default function LokSabhaDashboard() {
  const [voters, setVoters] = useState([]);

  useEffect(() => {
    fetch("/api/voter-data?type=lok-sabha")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Lok Sabha voters");
        return res.json();
      })
      .then((data) => setVoters(parseVoterListResponse(data)))
      .catch((err) =>
        console.error("Failed to load Lok Sabha voters:", err)
      );
  }, []);

  const ageGroups = {
    "18–30": 0,
    "31–45": 0,
    "46–60": 0,
    "60+": 0,
  };

  const genderCount = {
    male: 0,
    female: 0,
    other: 0,
  };

  voters.forEach((v) => {
    const age = getVoterAge(v);
    if (age !== null) {
      if (age <= 30) ageGroups["18–30"]++;
      else if (age <= 45) ageGroups["31–45"]++;
      else if (age <= 60) ageGroups["46–60"]++;
      else ageGroups["60+"]++;
    }

    genderCount[classifyVoterGender(v)]++;
  });

  const ageData = {
    labels: Object.keys(ageGroups),
    datasets: [
      {
        label: "Age Distribution",
        data: Object.values(ageGroups),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const genderData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        label: "Gender Ratio",
        data: Object.values(genderCount),
        backgroundColor: ["#60a5fa", "#f472b6", "#a78bfa"],
      },
    ],
  };

  return (
    <div className="pt-20 px-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-blue-700 mb-6">
        Lok Sabha Voter Dashboard
      </h2>

      <div className="mb-10">
        <Bar data={ageData} />
      </div>

      <div className="mb-10">
        <Pie data={genderData} />
      </div>
    </div>
  );
}
