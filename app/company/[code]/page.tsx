"use client"
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import jsPDF from 'jspdf'
// @ts-ignore - jspdf-autotable has no default export types in some setups
import autoTable from 'jspdf-autotable'

function Page() {
    const params = useParams()
    const code = params.code

    
    const [fileContent, setFileContent] = useState(null);
    const [lgrdata, setlgrdata] = useState<LgrEntry[]>([]);

    interface LgrEntry {
  _id?: string;
  DATE: string;
  BOOK: string;
  DESCRIBE: string;
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
      if(!code) return;
      const response = await axios.get(`/api/company?code=${code}`)
      setlgrdata(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      console.log(error,"error in getting the data from the frontend");
      alert("error in getting the data from the frontend");
      setlgrdata([])
    }
  }
useEffect(()=>{
    getLgrdata()
},[])

  const formattedRows = useMemo(() => {
    const formatDate = (dateString: string) => {
      const d = new Date(dateString as any)
      if (isNaN(d.getTime())) return ''
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear().toString().slice(-2)
      return `${day}-${month}-${year}`
    }
    return lgrdata.map(r => [
      formatDate(r.DATE as unknown as string),
      r.BOOK ?? '',
      r.DESCRIBE ?? '', // Use DESCRIBE for 'Particulars'
      r.DEBIT ?? '',
      r.CREDIT ?? '',
      r.BALANCE ?? ''
    ])
  }, [lgrdata])

  const downloadPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)
      doc.text(`Account statement for ${code} company`, 40, 40)
      // @ts-ignore
      autoTable(doc, {
        startY: 60,
        head: [["Date","Book","Particulars","Debit","Credit","Balance"]],
        body: formattedRows as any,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 33, 33], textColor: 255 },
        theme: 'grid',
      })
      doc.save(`ledger_${code}.pdf`)
    } catch (e) {
      console.error('PDF generation failed:', e)
    }
  }


  return (
    <div>
        <h1 className=' flex justify-center items-center bg-gray-800 text-2xl text-gray-300 p-2 m-2'>Account statement for {code} company</h1>
        
      {/* <h2 className='ml-2'>Upload LGR JSON File here </h2> */}
    <div className='m-2 flex gap-4'>
      {/* <input className='w-1/6 p-2 rounded-2xl border white bg-gray-800 text-center  hover:bg-gray-600 ' type="file" accept=".json" onChange={handleFileChange} /> */}
     <button className='border white bg-gray-800 rounded-3xl p-2 hover:bg-gray-600 text-gray-300 active:bg-gray-600' onClick={getLgrdata}>Show the lgr data</button>
     <button className='border white bg-green-700 rounded-3xl p-2 hover:bg-green-600 text-white active:bg-green-700' onClick={downloadPdf}>Download PDF</button>
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
                            <td className="px-1 py-1 md:px-4 md:py-2 truncate max-w-[80px] md:max-w-none" title={item.DESCRIBE}>{item.DESCRIBE}</td>
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