"use client"
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

function Page() {
    const params = useParams()
    const code = params.code

    
    const [fileContent, setFileContent] = useState(null);
    const [lgrdata, setlgrdata] = useState<LgrEntry[]>([]);

    interface LgrEntry {
  _id?: string;
  DATE: string;
  BOOK: string;
  PARTICULARS: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

    
    // masdata 
    // lgrdata 
    // masdata -> code and name 
    // lgrdata -> date,book, particulars, debit, credit, balance

    // already handled in the home page.
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post('/api/company', json);
        console.log("Uploaded successfully:", response.data);
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  };


    const postdata = async ()=>{
        try {
            const response = await axios.post("/api/company")
            console.log(response, "lgr data fetched in the frontend");
            getLgrdata()
            
        } catch (error: any ) {
            console.log("error: data didnt posted from the frontend ");
        }
    }

    const getLgrdata = async ()=>{
        try {
            const response = await axios.get(`/api/company?code=${code}`)
            console.log("API Response:", response.data);
            setlgrdata(response.data)
            console.log("Data length:", response.data.length);
        } catch (error: any) {
            console.log(error,"error in getting the data from the frontend");
        }
    }
useEffect(()=>{
    getLgrdata()
},[])


  return (
    <div>
        <h1 className=' flex justify-center items-center bg-gray-800 text-2xl p-2 m-2'>Account statement for {code} company</h1>
        
      {/* <h2 className='ml-2'>Upload LGR JSON File here </h2> */}
    <div className='m-2 flex gap-4'>
      {/* <input className='w-1/6 p-2 rounded-2xl border white bg-gray-800 text-center  hover:bg-gray-600 ' type="file" accept=".json" onChange={handleFileChange} /> */}
     <button className='border white bg-gray-800 rounded-3xl p-2 hover:bg-gray-600 active:bg-gray-600' onClick={getLgrdata}>Show the lgr data</button>
    </div>


        {/* <button onClick={postdata} className='bg-blue-500'>fetch the lgr data</button> */}
{/* lgrdata in json form */}
            {/* {lgrdata.map((item,index)=>(
            <div className='bg-gray-700' key={item._id}>
                <p>date: {item.DATE}</p>
                <p>book: {item.BOOK}</p>
                <p>particulars: {item.PARTICULARS}</p>
                <p>debit: {item.DEBIT}</p>
                <p>credit: {item.CREDIT}</p>
                <p>balance: {item.BALANCE}</p>
            </div> 
            ))} */}

            {lgrdata.length > 0 ? (
              <div>
                {/* Responsive Table for all screens */}
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border border-gray-300 rounded-lg text-xs md:text-base">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-1 py-1 md:px-4 md:py-2">Date</th>
                        <th className="px-1 py-1 md:px-4 md:py-2">Book</th>
                        <th className="px-1 py-1 md:px-4 md:py-2">Particulars</th>
                        <th className="px-1 py-1 md:px-4 md:py-2">Debit</th>
                        <th className="px-1 py-1 md:px-4 md:py-2">Credit</th>
                        <th className="px-1 py-1 md:px-4 md:py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-center">
                      {lgrdata.map((item, index) => {
                        const formatDate = (dateString: string) => {
                          const date = new Date(dateString);
                          const day = date.getDate().toString().padStart(2, '0');
                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                          const year = date.getFullYear().toString().slice(-2);
                          return `${day}-${month}-${year}`;
                        };
                        return (
                          <tr key={item._id || index} className="border-b text-black">
                            <td className="px-1 py-1 md:px-4 md:py-2">{formatDate(item.DATE)}</td>
                            <td className="px-1 py-1 md:px-4 md:py-2">{item.BOOK}</td>
                            <td className="px-1 py-1 md:px-4 md:py-2 truncate max-w-[80px] md:max-w-none" title={item.PARTICULARS}>{item.PARTICULARS}</td>
                            <td className="px-1 py-1 md:px-4 md:py-2 text-green-600 font-medium">{item.DEBIT}</td>
                            <td className="px-1 py-1 md:px-4 md:py-2 text-red-600 font-medium">{item.CREDIT}</td>
                            <td className="px-1 py-1 md:px-4 md:py-2 font-semibold">{item.BALANCE}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No data found.</p>
            )}
           
      

       



    </div>
  )
}

export default Page