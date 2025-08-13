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
  const [phone, setPhone] = useState<string | null>(null);

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
      console.log(error,"error in fetching the mas data");
    }
  };
  const router = useRouter();

  const fetchinside = async (e: Number) => {
    try {
      const code = e;
      // const response = await axios.get(`/company/${code}`)
      router.push(`/company/${code}`);
    } catch (error: any) {
      console.log(error, "error in fetching the insider info from frontend");
    }
  };

  const logout = async () => {
    try {
      // Call backend cleanup route to delete user data
    // Call backend cleanup route to delete user data, with credentials
    await axios.post("/api/auth/cleanup", {}, { withCredentials: true });
      await axios.get("/api/auth/logout", { withCredentials: true });
      setdata([]); // Clear frontend state
      router.push("/auth/login");
    } catch (error: any) {
      console.log(error,"error in logout");
    }
  };

  useEffect(() => {
 
  
    getMasdata();
  }, []);
  return (
    <div>
      
    


      <div className="flex justify-between items-center">  
      <h1 className="border-b-2 flex justify-center items-center text-4xl">
        {phone && <span className="ml-4 text-lg text-gray-400">{phone}</span>}
      </h1>
      {/* logout button */}
      <div>
        {/* <button className="p-2 m-2 bg-red-900 text-white rounded-2xl" onClick={logout}>
        Log out
      </button> */}
      </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
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
