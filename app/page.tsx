"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  userId: string;
  phone: string;
  exp: number;
};

function Page() {
  const [data, setdata] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);

  const handleMasFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post("/api/", json);
        console.log("Uploaded successfully:", response.data);
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  };
  const handleLgrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post("/api/company", json);
        console.log("Uploaded successfully:", response.data);
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  };

  const filteredData = data.filter((item: any) => {
    const query = searchQuery.toLowerCase();
    return (
      item.CODE?.toString().toLowerCase().includes(query) ||
      item.ACCOUNT_N?.toLowerCase().includes(query) ||
      item.CITY?.toLowerCase().includes(query) ||
      item.AMOUNT?.toString().toLowerCase().includes(query)
    );
  });

  // const fetchdata = async () => {
  //   try {
  //     const response = await axios.post("/api/");
  //     console.log(response);
  //     getdata();
  //   } catch (error: any) {
  //     console.log(error, "error in fetching the data in the frontend");
  //   }
  // };

  const getMasdata = async () => {
    try {
      const response = await axios.get("/api/", { withCredentials: true });
      console.log(response);
      setdata(response.data);
    } catch (error: any) {
      console.log(error, "error in fetching the mas data");
    }
  };
  const router = useRouter();

  const fetchinside = (code: number | string) => {
    router.push(`/company/${code}`);
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setdata([]);
    router.push("/login");
  };

  useEffect(() => {
    getMasdata();
    // Fetch username from API
    const fetchUsername = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        setUsername(data.username);
      } catch {
        setUsername(null);
      }
    };
    fetchUsername();
  }, []);
  return (
    <div>
      <div className="flex justify-between p-2 m-2 border-b-2">
        <div className="text-lg font-semibold text-amber-500">{username ? `Welcome ${username}` : "no username found"}</div>
        <button className="bg-red-800 text-white rounded-2xl px-4 " onClick={logout}>
          Log out
        </button>
      </div>

      <div className="flex flex-col p-2 ml-4">
        {/* mas data input */}
        <h2>Upload MAS JSON File</h2>
        <div className="m-2 flex gap-4">
          <input
            className="w-1/6 p-2 rounded-2xl border white bg-gray-800 text-center  hover:bg-gray-600 "
            type="file"
            accept=".json"
            onChange={handleMasFileChange}
          />
          <button
            className="border white bg-gray-800 rounded-3xl p-2 hover:bg-gray-600"
            onClick={getMasdata}
          >
            Show the mas data
          </button>
        </div>
        {/* lgr data input */}
        <div>
          <h2 className="ml-2">Upload LGR JSON File here </h2>
          <div className="m-2 flex gap-4">
            <input
              className="w-1/6 p-2 rounded-2xl border white bg-gray-800 text-center  hover:bg-gray-600 "
              type="file"
              accept=".json"
              onChange={handleLgrFileChange}
            />
          </div>
        </div>
      </div>

      {data.length === 0 ? (
      <div className=" w-1/2 mx-auto bg-gray-900 text-blue-100 p-4 rounded align-center">
          no data found, please upload both the mas file and the lgr file at
          once.
        </div>
      ) : (
        <>
          {/* search input */}
          <div>
            <input
              type="text"
              placeholder="Search by any field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-1/6 p-2 rounded-2xl border white bg-gray-800 text-center  hover:bg-gray-600 "
            />
          </div>

          {/* masdata for display */}
          <div className="flex-wrap w-full m-2">
            <div className="border p-2 my-2 bg-gray-800 rounded  h-1/5">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-b">
                      CODE
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-b">
                      Account Name
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-b">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider border-b">
                      City
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: any) => (
                    <tr
                      onClick={() => fetchinside(item.CODE)}
                      key={item.CODE}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                        {item.CODE}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                        {item.ACCOUNT_N}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                        {item.AMOUNT}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-800">
                        {item.CITY}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Page;
