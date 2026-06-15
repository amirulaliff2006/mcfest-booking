import * as XLSX from "xlsx"
import jsPDF from "jspdf"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import paymentQR from "./assets/paymentQR.jpeg"

import { db, storage } from "./firebase/firebase"

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"

import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

function App() {
  const [page, setPage] = useState("home")
  const [participantType, setParticipantType] = useState("student")
  const [adminTab, setAdminTab] = useState("dashboard")
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const [pendingPayment, setPendingPayment] = useState(null)
  const [pendingAgreement, setPendingAgreement] = useState(null)

  const [agreeRules, setAgreeRules] = useState(false)
  const [agreeDeclaration, setAgreeDeclaration] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [success, setSuccess] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const [walkinName, setWalkinName] = useState("")
  const [walkinPax, setWalkinPax] = useState(1)
  const [showWalkinForm, setShowWalkinForm] = useState(false)
  const [walkinParticipantType, setWalkinParticipantType] = useState("student")

  const [ticketPrice, setTicketPrice] = useState(0)
  const [dateKhamis, setDateKhamis] = useState("23 Mei 2026")
  const [dateJumaat, setDateJumaat] = useState("24 Mei 2026")
  const [dateSabtu, setDateSabtu] = useState("20 June 2026")
  const [whatsapp, setWhatsapp] = useState("601139832542")
  const [paymentLink, setPaymentLink] = useState("https://uitmpay.uitm.edu.my/otherservices/products/AAT3/02/6627")

  const [slotLimits, setSlotLimits] = useState({
    khamisPagi: 20,
    khamisPetang: 20,
    jumaatPagi: 20,
    jumaatPetang: 20,
    sabtuPagi: 20,
    sabtuPetang: 20,
  })

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const ticketFromUrl = new URLSearchParams(window.location.search).get("ticket")

  useEffect(() => {
    async function fetchBookings() {
      const settingsRef = doc(db, "settings", "eventConfig")
const settingsSnap = await getDoc(settingsRef)

if (settingsSnap.exists()) {
  const data = settingsSnap.data()

  setTicketPrice(data.ticketPrice || 0)
  setWhatsapp(data.whatsapp || "")
  setPaymentLink(data.paymentLink || "")

  setDateKhamis(data.dateKhamis || "")
  setDateJumaat(data.dateJumaat || "")
  setDateSabtu(data.dateSabtu || "")

  setSlotLimits({
    khamisPagi: data.khamisPagi || 20,
    khamisPetang: data.khamisPetang || 20,

    jumaatPagi: data.jumaatPagi || 20,
    jumaatPetang: data.jumaatPetang || 20,

    sabtuPagi: data.sabtuPagi || 20,
    sabtuPetang: data.sabtuPetang || 20,
  })
}
      const querySnapshot = await getDocs(collection(db, "bookings"))

      const bookingList = querySnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }))

      setBookings(bookingList)
      setLoading(false)
    }

    fetchBookings()
  }, [])

  const onlineBookings = bookings.filter((b) => b.type === "booking")
  const walkins = bookings.filter((b) => b.type === "walkin")

  const khamisPagiBooked = onlineBookings.filter(
    (b) => b.day === "Khamis" && b.session === "Pagi"
  ).length

  const khamisPetangBooked = onlineBookings.filter(
    (b) => b.day === "Khamis" && b.session === "Petang"
  ).length

  const jumaatPagiBooked = onlineBookings.filter(
    (b) => b.day === "Jumaat" && b.session === "Pagi"
  ).length

  const jumaatPetangBooked = onlineBookings.filter(
    (b) => b.day === "Jumaat" && b.session === "Petang"
  ).length
const sabtuPagiBooked = onlineBookings.filter(
  (b) => b.day === "Sabtu" && b.session === "Pagi"
).length

const sabtuPetangBooked = onlineBookings.filter(
  (b) => b.day === "Sabtu" && b.session === "Petang"
).length

  const slotData = {
    khamisPagi: {
      booked: khamisPagiBooked,
      max: slotLimits.khamisPagi,
    },
    khamisPetang: {
      booked: khamisPetangBooked,
      max: slotLimits.khamisPetang,
    },
    jumaatPagi: {
      booked: jumaatPagiBooked,
      max: slotLimits.jumaatPagi,
    },
    jumaatPetang: {
      booked: jumaatPetangBooked,
      max: slotLimits.jumaatPetang,
    },
    sabtuPagi: {
  booked: sabtuPagiBooked,
  max: slotLimits.sabtuPagi,
},

sabtuPetang: {
  booked: sabtuPetangBooked,
  max: slotLimits.sabtuPetang,
},
  }

  async function handleBooking(e) {
    e.preventDefault()

    const formData = new FormData(e.target)

    const selectedDay = formData.get("day")
    const selectedSession = formData.get("session")

    if (
      selectedDay === "Khamis" &&
      selectedSession === "Pagi" &&
      khamisPagiBooked >= slotLimits.khamisPagi
    ) {
      alert("Khamis Pagi FULL")
      return
    }

    if (
      selectedDay === "Khamis" &&
      selectedSession === "Petang" &&
      khamisPetangBooked >= slotLimits.khamisPetang
    ) {
      alert("Khamis Petang FULL")
      return
    }

    if (
      selectedDay === "Jumaat" &&
      selectedSession === "Pagi" &&
      jumaatPagiBooked >= slotLimits.jumaatPagi
    ) {
      alert("Jumaat Pagi FULL")
      return
    }

    if (
      selectedDay === "Jumaat" &&
      selectedSession === "Petang" &&
      jumaatPetangBooked >= slotLimits.jumaatPetang
    ) {
      alert("Jumaat Petang FULL")
      return
    }if (
  selectedDay === "Sabtu" &&
  selectedSession === "Pagi" &&
  sabtuPagiBooked >= slotLimits.sabtuPagi
) {
  alert("Sabtu Pagi FULL")
  return
}

if (
  selectedDay === "Sabtu" &&
  selectedSession === "Petang" &&
  sabtuPetangBooked >= slotLimits.sabtuPetang
) {
  alert("Sabtu Petang FULL")
  return
}

    const newBooking = {
      ticketId: `BKG${Date.now().toString().slice(-5)}`,
      groupName: formData.get("groupName"),
      day: selectedDay,
      date:
  selectedDay === "Khamis"
    ? dateKhamis
    : selectedDay === "Jumaat"
    ? dateJumaat
    : dateSabtu,
      session: selectedSession,
      phone: formData.get("phone"),
      status: "Pending Payment",
      paymentStatus: "Waiting Proof",
      paymentProofUrl: "",
      type: "booking",
      pax: 5,
     members: [1, 2, 3, 4, 5].map((num) => ({
  name: formData.get(`member${num}`),
  studentId: formData.get(`studentId${num}`) || "",
  phone: formData.get(`memberPhone${num}`) || "",
})),

participantType: formData.get("participantType"),
      createdAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "bookings"), newBooking)

    const savedBooking = {
      ...newBooking,
      id: docRef.id,
    }

   setBookings([...bookings, savedBooking])

setPendingAgreement(savedBooking)

setAgreeRules(false)
setAgreeDeclaration(false)

e.target.reset()
  }
    async function submitPaymentProof() {
    if (!paymentProof || !pendingPayment) return

    setUploading(true)

    const proofRef = ref(
      storage,
      `paymentProofs/${pendingPayment.ticketId}-${Date.now()}-${paymentProof.name}`
    )

    await uploadBytes(proofRef, paymentProof)

    const proofUrl = await getDownloadURL(proofRef)

    await updateDoc(doc(db, "bookings", pendingPayment.id), {
      paymentStatus: "Uploaded",
      paymentProofUrl: proofUrl,
      status: "Paid",
    })

    const updatedBooking = {
      ...pendingPayment,
      paymentStatus: "Uploaded",
      paymentProofUrl: proofUrl,
      status: "Paid",
    }

    setBookings(
      bookings.map((booking) =>
        booking.id === pendingPayment.id ? updatedBooking : booking
      )
    )

    setPendingPayment(null)
    setPaymentProof(null)
    setSuccess(updatedBooking)
    setUploading(false)
  }

  async function markDone(id) {
    await updateDoc(doc(db, "bookings", id), {
      status: "Done",
    })

    setBookings(
      bookings.map((booking) =>
        booking.id === id ? { ...booking, status: "Done" } : booking
      )
    )
  }

  async function deleteBooking(id) {
    await deleteDoc(doc(db, "bookings", id))

    setBookings(bookings.filter((booking) => booking.id !== id))
  }

  async function createWalkinBooking() {
  const groupName =
    document.getElementById("walkinGroupName")?.value || ""

  const phone =
    document.getElementById("walkinPhone")?.value || ""

  const day =
    document.getElementById("walkinDay")?.value || "Khamis"

  const session =
    document.getElementById("walkinSession")?.value || "Pagi"

  if (!groupName || !phone) {
    alert("Sila isi maklumat kumpulan")
    return
  }

  const members = [1, 2, 3, 4, 5].map((num) => ({
    name:
      document.getElementById(`walkinMember${num}`)?.value || "",

    studentId:
      document.getElementById(`walkinStudent${num}`)?.value || "",

    phone:
      document.getElementById(`walkinMemberPhone${num}`)?.value || "",
  }))

  const walkinData = {
    ticketId: `WALKIN-${Date.now()}`,

    type: "walkin",

    participantType: walkinParticipantType,

    groupName,

    phone,

    members,

    pax: 5,

    day,

    session,

    date:
      day === "Khamis"
        ? dateKhamis
        : day === "Jumaat"
        ? dateJumaat
        : dateSabtu,

    paymentStatus: "Walk-In",

    status: "Done",

    createdAt: new Date(),
  }

  const docRef = await addDoc(
    collection(db, "bookings"),
    walkinData
  )

  setBookings([
    ...bookings,
    {
      ...walkinData,
      id: docRef.id,
    },
  ])

  setShowWalkinForm(false)

  alert("Walk-in berjaya ditambah")
}

  async function addWalkin() {
    if (!walkinName) return

    const newWalkin = {
      ticketId: `WALK${Date.now().toString().slice(-5)}`,
      groupName: walkinName,
      day: "Walk In",
      date: "-",
      session: "Walk In",
      phone: "-",
      status: "Done",
      paymentStatus: "Walk-in",
      paymentProofUrl: "",
      type: "walkin",
      pax: Number(walkinPax),
      members: [walkinName],
      createdAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "bookings"), newWalkin)

    setBookings([
      ...bookings,
      {
        ...newWalkin,
        id: docRef.id,
      },
    ])

    setWalkinName("")
    setWalkinPax(1)
  }
 function downloadTicketPDF(ticket) {
  const qrCanvas = document.querySelector("#ticket-pdf canvas")

  if (!qrCanvas) {
    alert("QR belum ready. Cuba tekan sekali lagi.")
    return
  }

  const qrImage = qrCanvas.toDataURL("image/png")
  const pdf = new jsPDF("p", "mm", "a4")

  pdf.setFillColor(0, 0, 0)
  pdf.rect(0, 0, 210, 297, "F")

  pdf.setTextColor(220, 38, 38)
  pdf.setFontSize(28)
  pdf.text("MCFEST TICKET", 105, 25, { align: "center" })

  pdf.addImage(qrImage, "PNG", 65, 40, 80, 80)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)

  pdf.text(`Ticket ID: ${ticket.ticketId}`, 20, 140)
  pdf.text(`Group: ${ticket.groupName}`, 20, 152)
  pdf.text(`Payment: ${ticket.paymentStatus}`, 20, 164)
  pdf.text(`Status: ${ticket.status}`, 20, 176)
  pdf.text(`Total: 5 Pax`, 20, 188)
  pdf.text(`Hari: ${ticket.day}`, 20, 200)
  pdf.text(`Tarikh: ${ticket.date}`, 20, 212)
  pdf.text(`Session: ${ticket.session}`, 20, 224)

  pdf.setTextColor(160, 160, 160)
  pdf.setFontSize(11)
  pdf.text("Sila tunjuk QR ini semasa hadir ke event.", 105, 250, {
    align: "center",
  })

  pdf.save(`${ticket.ticketId}-MCFEST-Ticket.pdf`)
}
  function exportParticipants() {
  const rows = []

  bookings.forEach((booking) => {
    
      ;(booking.members || []).forEach((member, index) => {
        rows.push({
          "Type":booking.type,
          "Ticket ID": booking.ticketId,
          "Group Name": booking.groupName,
          "Member No": index + 1,
          "Name": typeof member === "string" ? member : member.name,
          "Student ID": typeof member === "string" ? "" : member.studentId || "",
          "Member Phone": typeof member === "string" ? "" : member.phone || "",
          "Participant Type": booking.participantType || "student",
          "Phone Wakil": booking.phone,
          "Day": booking.day,
          "Date": booking.date,
          "Session": booking.session,
          "Payment Status": booking.paymentStatus,
          "Status": booking.status,
        })
      })
    
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants")
  XLSX.writeFile(workbook, "MCFEST_Participants.xlsx")
}
  async function saveSettings() {
  await setDoc(doc(db, "settings", "eventConfig"), {
    ticketPrice: Number(ticketPrice),
    whatsapp: whatsapp,
    paymentLink: paymentLink,
    dateKhamis: dateKhamis,
    dateJumaat: dateJumaat,
    dateSabtu: dateSabtu,

sabtuPagi: Number(slotLimits.sabtuPagi),
sabtuPetang: Number(slotLimits.sabtuPetang),
    khamisPagi: Number(slotLimits.khamisPagi),
    khamisPetang: Number(slotLimits.khamisPetang),
    jumaatPagi: Number(slotLimits.jumaatPagi),
    jumaatPetang: Number(slotLimits.jumaatPetang),
  })

  alert("Settings saved successfully!")
}
  const filteredBookings = bookings.filter((booking) => {
    const text = [
      booking.ticketId,
      booking.groupName,
      booking.phone,
      booking.day,
      booking.session,
      booking.status,
      booking.paymentStatus,
      booking.type,
      ...(booking.members || []),
    ]
      .join(" ")
      .toLowerCase()

    const matchSearch = text.includes(search.toLowerCase())

    const matchFilter =
      filter === "all" || booking.status === filter || booking.type === filter

    return matchSearch && matchFilter
  })

  const totalPeople = bookings.reduce(
    (sum, booking) => sum + Number(booking.pax || 5),
    0
  )

  const totalProfit = bookings.reduce(
    (sum, booking) => sum + Number(booking.pax || 5) * Number(ticketPrice),
    0
  )

  const bookingProfit = onlineBookings.reduce(
    (sum, booking) => sum + Number(booking.pax || 5) * Number(ticketPrice),
    0
  )

  const walkinProfit = walkins.reduce(
    (sum, booking) => sum + Number(booking.pax || 5) * Number(ticketPrice),
    0
  )

  if (ticketFromUrl) {
    return (
      <TicketVerifyPage
        ticket={ticketFromUrl}
        bookings={bookings}
        loading={loading}
        markDone={markDone}
      />
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {page === "home" || !isAdminLoggedIn ? (
        <MainPage
          setPage={setPage}
          participantType={participantType}
          setParticipantType={setParticipantType}
          setShowAdminLogin={setShowAdminLogin}
          handleBooking={handleBooking}
          dateKhamis={dateKhamis}
          dateJumaat={dateJumaat}
          dateSabtu={dateSabtu}
          whatsapp={whatsapp}
          slotData={slotData}
        />
      ) : (
        <AdminPanel
          setPage={setPage}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
          exportParticipants={exportParticipants}
          saveSettings={saveSettings}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          onlineBookings={onlineBookings}
          walkins={walkins}
          filteredBookings={filteredBookings}
          setSelectedGroup={setSelectedGroup}
          markDone={markDone}
          deleteBooking={deleteBooking}
          ticketPrice={ticketPrice}
          setTicketPrice={setTicketPrice}
          dateKhamis={dateKhamis}
          setDateKhamis={setDateKhamis}
          dateJumaat={dateJumaat}
          setDateJumaat={setDateJumaat}
          dateSabtu={dateSabtu}
          setDateSabtu={setDateSabtu}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          paymentLink={paymentLink}
          setPaymentLink={setPaymentLink}
          slotLimits={slotLimits}
          setSlotLimits={setSlotLimits}
          walkinName={walkinName}
          setWalkinName={setWalkinName}
          walkinPax={walkinPax}
          setWalkinPax={setWalkinPax}
          addWalkin={addWalkin}
          setShowWalkinForm={setShowWalkinForm}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          totalPeople={totalPeople}
          totalProfit={totalProfit}
          bookingProfit={bookingProfit}
          walkinProfit={walkinProfit}
        />
      )}
      {pendingAgreement && (
  <Popup>
    <h2 className="horror-subtitle mb-4 text-center text-3xl text-red-600">
      PERATURAN PESERTA
    </h2>

    <div className="max-h-[350px] overflow-y-auto rounded-xl border border-red-900 bg-black/70 p-4 text-sm leading-7">

      <p className="font-bold text-red-500">
        PESERTA HENDAKLAH MEMATUHI PERATURAN DI BAWAH:
      </p>

      <br />

      <p>
        1. Semua peserta hendaklah menjaga tutur kata dan tidak menggunakan bahasa yang kesat atau tidak sopan sepanjang program berlangsung.
      </p>

      <p>
        2. Peserta tidak dibenarkan membuat sebarang rakaman video atau audio semasa permainan dijalankan.
      </p>

      <p>
        3. Pihak penganjur tidak akan bertanggungjawab terhadap sebarang kehilangan atau kerosakan barangan peribadi.
      </p>

      <p>
        4. Telefon bimbit akan dikumpulkan sebelum permainan bermula dan hanya akan dipulangkan selepas permainan tamat.
      </p>

      <label className="mt-5 flex items-start gap-3">
        <input
          type="checkbox"
          checked={agreeRules}
          onChange={(e) =>
            setAgreeRules(e.target.checked)
          }
        />

        <span>
          Saya telah membaca dan bersetuju dengan semua peraturan di atas.
        </span>
      </label>

      <hr className="my-5 border-red-900" />

      <h3 className="font-bold text-red-500">
        Declaration of Own Responsibility
      </h3>

      <p className="mt-3">
        Dengan menekan kotak persetujuan ini, saya mengesahkan bahawa saya telah membaca,
        memahami dan bersetuju dengan segala syarat yang dinyatakan.
      </p>

      <p className="mt-3">
        Saya mengakui bahawa segala tindakan, keputusan, risiko dan implikasi adalah
        di bawah tanggungjawab saya sendiri.
      </p>

      <p className="mt-3">
        Saya juga bersetuju untuk tidak membuat sebarang tuntutan atau
        mempertanggungjawabkan mana-mana pihak terhadap perkara yang berlaku
        hasil daripada tindakan saya sendiri.
      </p>

      <label className="mt-5 flex items-start gap-3">
        <input
          type="checkbox"
          checked={agreeDeclaration}
          onChange={(e) =>
            setAgreeDeclaration(e.target.checked)
          }
        />

        <span>
          Saya bersetuju dengan Declaration of Own Responsibility.
        </span>
      </label>

    </div>

    <button
      disabled={
        !agreeRules ||
        !agreeDeclaration
      }
      onClick={() => {
        setPendingPayment(
          pendingAgreement
        )

        setPendingAgreement(
          null
        )
      }}
      className="
      mt-5
      w-full
      rounded-xl
      bg-red-700
      py-3
      font-bold
      disabled:bg-gray-700
      "
    >
      Continue To Payment
    </button>
  </Popup>
)}
            {pendingPayment && (
        <Popup>
          <h2 className="horror-subtitle mb-4 text-center text-4xl text-red-600">
            PAYMENT
          </h2>

          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/20 p-4 text-center">
            <p className="text-sm text-gray-400">Ticket ID</p>
            <p className="text-2xl font-black text-red-500">
              {pendingPayment.ticketId}
            </p>
          </div>

          <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="mb-5 block w-full rounded-xl bg-red-700 py-4 text-center font-black uppercase tracking-widest hover:bg-red-600"
            >
              Proceed To Payment
            </a>

            <p className="mb-5 text-center text-sm text-gray-400">
              Selepas pembayaran berjaya, kembali ke halaman ini dan upload bukti pembayaran.
            </p>

          <div className="mb-5 space-y-2 text-center">
            <p>Group: {pendingPayment.groupName}</p>
            <p>Total Ticket: 5 Pax</p>
            <p>
              Amount:{" "}
              <span className="font-black text-red-500">
                RM{Number(ticketPrice) * 5}
              </span>
            </p>
          </div>

          <label className="mb-3 block text-sm text-gray-400">
            Upload Proof Payment
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPaymentProof(e.target.files[0])}
            className="mb-5 w-full rounded-xl border border-red-900 bg-black p-3"
          />

          <button
            onClick={submitPaymentProof}
            disabled={!paymentProof || uploading}
            className="w-full rounded-xl bg-red-700 py-3 font-bold hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-700"
          >
            {uploading ? "Uploading..." : "Submit Payment Proof"}
          </button>
        </Popup>
      )}
    {showWalkinForm && (
  <Popup>
    <h2 className="horror-subtitle mb-4 text-center text-3xl text-red-600">
      WALK-IN REGISTRATION
    </h2>

    <input
      className="field mb-3"
      placeholder="Nama Kumpulan"
      id="walkinGroupName"
    />

    <input
      className="field mb-3"
      placeholder="No Telefon Wakil"
      id="walkinPhone"
    />

    <div className="grid grid-cols-2 gap-3 mb-3">
      <select id="walkinDay" className="field">
        <option>Khamis</option>
        <option>Jumaat</option>
        <option>Sabtu</option>
      </select>

      <select id="walkinSession" className="field">
        <option>Pagi</option>
        <option>Petang</option>
      </select>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          checked={walkinParticipantType === "student"}
          onChange={() =>
            setWalkinParticipantType("student")
          }
        />
        Student
      </label>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          checked={walkinParticipantType === "nonStudent"}
          onChange={() =>
            setWalkinParticipantType("nonStudent")
          }
        />
        Non Student
      </label>
    </div>

    {[1, 2, 3, 4, 5].map((num) => (
      <div
        key={num}
        className="grid grid-cols-1 gap-2 mb-2 md:grid-cols-2"
      >
        <input
          className="field"
          placeholder={`Nama Ahli ${num}`}
          id={`walkinMember${num}`}
        />

        {walkinParticipantType === "student" ? (
          <input
            className="field"
            placeholder={`Student ID ${num}`}
            id={`walkinStudent${num}`}
          />
        ) : (
          <input
            className="field"
            placeholder={`No Telefon ${num}`}
            id={`walkinMemberPhone${num}`}
          />
        )}
      </div>
    ))}

    <button
      onClick={createWalkinBooking}
      className="mt-4 w-full rounded-xl bg-red-700 py-3 font-bold"
    >
      SAVE WALK-IN
    </button>

    <button
      onClick={() => setShowWalkinForm(false)}
      className="mt-3 w-full rounded-xl border border-red-700 py-3"
    >
      CANCEL
    </button>
  </Popup>
)}
      {success && (
        <Popup>
          <div id="ticket-pdf" className="rounded-2xl bg-black p-5 text-white">
          <h2 className="horror-subtitle mb-4 text-center text-4xl text-red-600">
            TICKET BERJAYA
            <div id="ticket-pdf" className="rounded-2xl bg-black p-5 text-white"></div>
          </h2>

          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeCanvas
                value={`${window.location.origin}?ticket=${encodeURIComponent(
                  success.ticketId
                )}`}
                size={180}
              />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p>
              <span className="font-bold text-red-500">Ticket ID:</span>{" "}
              {success.ticketId}
            </p>

            <p>
              <span className="font-bold text-red-500">Group:</span>{" "}
              {success.groupName}
            </p>

            <p>
              <span className="font-bold text-red-500">Payment:</span>{" "}
              {success.paymentStatus}
            </p>

            <p>
              <span className="font-bold text-red-500">Status:</span>{" "}
              {success.status}
            </p>

            <p>
              <span className="font-bold text-red-500">Total:</span> 5 Pax
            </p>

            <p>
              <span className="font-bold text-red-500">Hari:</span>{" "}
              {success.day}
            </p>

            <p>
              <span className="font-bold text-red-500">Tarikh:</span>{" "}
              {success.date}
            </p>

            <p>
              <span className="font-bold text-red-500">Session:</span>{" "}
              {success.session}
            </p>
          </div>

          <p className="mt-5 text-center text-sm text-gray-400">
            Tunjuk QR ini semasa hadir ke event.
          </p>
          </div>
          
                <button
  onClick={() => downloadTicketPDF(success)}
  className="mt-5 w-full rounded-xl bg-green-700 py-3 font-bold hover:bg-green-600"
>
  Download PDF Ticket
</button>
          <button
            onClick={() => setSuccess(false)}
            className="mt-6 w-full rounded-xl bg-red-700 py-3 font-bold hover:bg-red-600"
          >
            TUTUP
          </button>
        </Popup>
      )}
      {showAdminLogin && (
  <Popup>
    <h2 className="horror-subtitle mb-5 text-center text-4xl text-red-600">
      ADMIN LOGIN
    </h2>

    <input
      type="password"
      placeholder="Masukkan Password"
      value={adminPassword}
      onChange={(e) => setAdminPassword(e.target.value)}
      className="field mb-5"
    />

    <button
      onClick={() => {
        if (adminPassword === "admin123") {
          setIsAdminLoggedIn(true)
          setShowAdminLogin(false)
          setPage("admin")
          setAdminPassword("")
        } else {
          alert("Password Salah")
        }
      }}
      className="w-full rounded-xl bg-red-700 py-3 font-bold"
    >
      LOGIN
    </button>

    <button
      onClick={() => {
        setShowAdminLogin(false)
        setAdminPassword("")
      }}
      className="mt-3 w-full rounded-xl border border-red-700 py-3"
    >
      CANCEL
    </button>
  </Popup>
)}
      {selectedGroup && (
        <Popup>
          <h2 className="horror-subtitle mb-4 text-4xl text-red-600">
            {selectedGroup.groupName}
          </h2>

          <div className="mb-5 flex justify-center">
            <div className="rounded-xl bg-white p-3">
              <QRCodeCanvas
                value={`${window.location.origin}?ticket=${encodeURIComponent(
                  selectedGroup.ticketId
                )}`}
                size={140}
              />
            </div>
          </div>

          <ol className="mb-6 space-y-3">
            {(selectedGroup.members || []).map((member, index) => (
              <li
                key={index}
                className="rounded-xl border border-red-900 bg-black/70 p-3"
              >
                {index + 1}. {
               typeof member === "string"
  ? member
  : member.studentId
  ? `${member.name} (${member.studentId})`
  : `${member.name} (${member.phone})`
              }
              </li>
            ))}
          </ol>

          <p className="mb-2">Ticket ID: {selectedGroup.ticketId}</p>
          <p className="mb-2">Payment: {selectedGroup.paymentStatus}</p>
          <p className="mb-2">Status: {selectedGroup.status}</p>
          <p className="mb-2">Hari: {selectedGroup.day}</p>
          <p className="mb-2">Tarikh: {selectedGroup.date || "-"}</p>
          <p className="mb-2">Session: {selectedGroup.session}</p>
          <p className="mb-2">Pax: {selectedGroup.pax || 5}</p>
          <p className="mb-6">Phone: {selectedGroup.phone}</p>

          {selectedGroup.paymentProofUrl && (
            <a
              href={selectedGroup.paymentProofUrl}
              target="_blank"
              className="mb-5 block rounded-xl bg-green-700 py-3 text-center font-bold hover:bg-green-600"
            >
              View Payment Proof
            </a>
          )}

          <button
            onClick={() => setSelectedGroup(null)}
            className="w-full rounded-xl bg-red-700 py-3 font-bold hover:bg-red-600"
          >
            TUTUP
          </button>
        </Popup>
      )}
    </div>
  )
}
function TicketVerifyPage({
  ticket,
  bookings,
  loading,
  markDone,
}) {
  const foundTicket = bookings.find(
    (b) => b.ticketId === ticket
  )

  if (loading) {
    return (
      <div className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-black
      text-white
      ">
        CHECKING...
      </div>
    )
  }

  if (!foundTicket) {
    return (
      <div className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-black
      text-white
      ">
        INVALID TICKET
      </div>
    )
  }

  return (
    <div className="
    flex
    min-h-screen
    items-center
    justify-center
    bg-black
    p-6
    text-white
    ">

      <div className="
      w-full
      max-w-md
      rounded-2xl
      border
      border-red-700
      bg-black
      p-8
      ">

        <h1 className="
        horror-subtitle
        mb-5
        text-center
        text-4xl
        text-red-600
        ">
          VALID TICKET
        </h1>

        <p className="mb-2">
          Ticket:
          {" "}
          {foundTicket.ticketId}
        </p>

        <p className="mb-2">
          Group:
          {" "}
          {foundTicket.groupName}
        </p>

        <p className="mb-2">
          Hari:
          {" "}
          {foundTicket.day}
        </p>

        <p className="mb-2">
          Session:
          {" "}
          {foundTicket.session}
        </p>

        <p className="mb-2">
          Payment:
          {" "}
          {foundTicket.paymentStatus}
        </p>

        <p className="mb-5">
          Status:
          {" "}
          {foundTicket.status}
        </p>

        {foundTicket.status !==
        "Done" ? (

          <button
            onClick={() =>{
              const password = prompt("Masukkan Admin Password")

              if (password ==="admin123"){
                markDone(foundTicket.id)
              } else {
                alert("password SALAH! Admin SAHAJA!")
              }
      
            }}
            className="
            w-full
            rounded-xl
            bg-green-700
            py-3
            font-bold
            "
          >
           ADMIN MARK AS ENTERED
          </button>

        ) : (

          <div className="
          rounded-xl
          bg-red-900
          p-4
          text-center
          ">
            TICKET ALREADY USED
          </div>

        )}

      </div>

    </div>
  )
}

function SlotCard({
title,
booked,
max,
}) {

const full =
booked >= max

return (
<div className="
rounded-xl
border
border-red-900
bg-black
p-3
text-center
">

<p className="
text-xs
uppercase
text-gray-400
">
{title}
</p>

<h3 className="
mt-2
text-xl
font-black
text-red-500
">

{full
? "FULL"
: `${booked}/${max}`}

</h3>

</div>
)
}
function MainPage({
  setPage,
  participantType,
setParticipantType,
  setShowAdminLogin,
  handleBooking,
  dateKhamis,
  dateJumaat,
  dateSabtu,
  whatsapp,
  slotData,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="main-bg"></div>
      <div className="main-overlay"></div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-6">
        <nav className="flex items-center justify-between rounded-xl border border-white/5 bg-black/45 px-4 py-4 backdrop-blur">
          <div>
            <h1 className="horror-title text-4xl tracking-widest text-red-700">
              MCFEST
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white">
              Misteri Warisan Kampus
            </p>
          </div>

         <button
          onClick={() => setShowAdminLogin(true)}
          className="rounded-lg border border-red-600 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700"
        >
          Admin
        </button>
        </nav>

        <section className="pt-12 text-center md:pt-16">
          <h2 className="horror-title text-8xl tracking-widest text-red-700 drop-shadow-[0_0_25px_rgba(185,28,28,0.8)] md:text-[11rem]">
            MCFEST
          </h2>

          <h3 className="horror-subtitle mt-2 text-5xl uppercase tracking-wider text-white md:text-7xl">
            Misteri Warisan Kampus
          </h3>

          <p className="horror-text mt-4 text-sm uppercase tracking-[0.35em] text-red-500 md:text-base">
            Rumah Hantu | Kelab Kebudayaan x Kelab Relex
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <h4 className="horror-subtitle text-4xl uppercase text-white md:text-5xl">
              Berani ke <span className="text-red-600">kau</span> masuk?
            </h4>

            <p className="horror-text mt-5 leading-8 text-gray-300">
              Sebuah pengalaman seram yang akan menguji keberanian anda. Rahsia
              gelap kampus menanti mereka yang cukup berani untuk merungkainya.
              Kumpulkan <span className="text-red-500">5 orang</span> ahli
              kumpulan anda dan tempah slot sekarang sebelum semua tempat penuh!
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-0 sm:grid-cols-3">
            <Info title="5 Pax 1 Group" text="Kumpulkan 5 orang ahli" icon="👥" />
            <Info title="2 Session" text="Pagi & Petang" icon="🕘" middle />
            <Info title="3 Hari Sahaja!" text="Khamis Jumaat & Sabtu" icon="📅" />
          </div>

          <a
            href="#booking"
            className="mt-10 inline-block rounded-xl border border-red-600 bg-red-700/70 px-10 py-4 text-lg font-black uppercase tracking-widest shadow-[0_0_25px_rgba(185,28,28,0.5)] hover:bg-red-600"
          >
            Book Ticket Sekarang
          </a>
        </section>

        <section
          id="booking"
          className="mx-auto mt-10 mb-12 grid max-w-6xl grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-black/75 p-5 backdrop-blur lg:grid-cols-[1fr_420px]"
        >
          <div className="self-start space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoSmall
  title="Hari"
  text={`Khamis (${dateKhamis})
Jumaat (${dateJumaat})
Sabtu (${dateSabtu})`}
/>
              <InfoSmall title="Session" text="Pagi dan Petang" />

              <div className="h-fit rounded-xl border border-red-900/50 bg-black/60 p-5">
                <h5 className="text-lg font-black uppercase text-white">
                  Ada Masalah?
                </h5>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Hubungi kami melalui WhatsApp
                </p>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                >
                  WhatsApp Sekarang
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-red-900/50 bg-black/60 p-5">
              <h4 className="mb-4 font-black uppercase text-red-500">
                Live Slot
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <SlotCard
                  title="Khamis Pagi"
                  booked={slotData.khamisPagi.booked}
                  max={slotData.khamisPagi.max}
                />

                <SlotCard
                  title="Khamis Petang"
                  booked={slotData.khamisPetang.booked}
                  max={slotData.khamisPetang.max}
                />

                <SlotCard
                  title="Jumaat Pagi"
                  booked={slotData.jumaatPagi.booked}
                  max={slotData.jumaatPagi.max}
                />

                <SlotCard
                  title="Jumaat Petang"
                  booked={slotData.jumaatPetang.booked}
                  max={slotData.jumaatPetang.max}
                />
                <SlotCard
                  title="Sabtu Pagi"
                  booked={slotData.sabtuPagi.booked}
                  max={slotData.sabtuPagi.max}
                />

                <SlotCard
                  title="Sabtu Petang"
                  booked={slotData.sabtuPetang.booked}
                  max={slotData.sabtuPetang.max}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleBooking} className="space-y-3">
            <h4 className="horror-subtitle mb-3 text-3xl text-red-600">
              Book Ticket
            </h4>

            <input required name="groupName" placeholder="Nama Group" className="field" />

            <select required name="day" defaultValue="" className="field">
              <option value="">Pilih Hari</option>
              <option>Khamis</option>
              <option>Jumaat</option>
              <option>Sabtu</option>
            </select>

            <select required name="session" defaultValue="" className="field">
              <option value="">Pilih Session</option>
              <option>Pagi</option>
              <option>Petang</option>
            </select>

               <div className="grid grid-cols-2 gap-3 mb-4">

  <label className="flex items-center gap-2 rounded-xl border border-red-900 bg-black p-3">
    <input
      type="radio"
      name="participantType"
      value="student"
      checked={participantType === "student"}
      onChange={() => setParticipantType("student")}
    />
    Student
  </label>

  <label className="flex items-center gap-2 rounded-xl border border-red-900 bg-black p-3">
    <input
      type="radio"
      name="participantType"
      value="nonStudent"
      checked={participantType === "nonStudent"}
      onChange={() => setParticipantType("nonStudent")}
    />
    Non Student
  </label>

</div>

{[1, 2, 3, 4, 5].map((num) => (
  <div
    key={num}
    className="grid grid-cols-1 gap-2 md:grid-cols-2"
  >

    <input
      required
      name={`member${num}`}
      placeholder={`Nama Ahli ${num}`}
      className="field"
    />

    {participantType === "student" ? (
      <input
        required
        name={`studentId${num}`}
        placeholder={`Student ID Ahli ${num}`}
        className="field"
      />
    ) : (
      <input
        required
        name={`memberPhone${num}`}
        placeholder={`No Telefon Ahli ${num}`}
        className="field"
      />
    )}

  </div>
))}

            <input required name="phone" placeholder="No Telefon Wakil" className="field" />

            <button className="w-full rounded-xl bg-red-700 py-4 font-black uppercase tracking-widest hover:bg-red-600">
              Confirm Booking
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
function AdminPanel(props) {
  const {
    setPage,
    setIsAdminLoggedIn,
    exportParticipants,
    saveSettings,
    adminTab,
    setAdminTab,
    onlineBookings,
    walkins,
    filteredBookings,
    setSelectedGroup,
    markDone,
    deleteBooking,
    ticketPrice,
    setTicketPrice,
    dateKhamis,
    setDateKhamis,
    dateJumaat,
    setDateJumaat,
    dateSabtu,
    setDateSabtu,
    whatsapp,
    setWhatsapp,
    paymentLink,
    setPaymentLink,
    slotLimits,
    setSlotLimits,
    walkinName,
    setWalkinName,
    walkinPax,
    setWalkinPax,
    addWalkin,
    setShowWalkinForm,
    search,
    setSearch,
    filter,
    setFilter,
    totalPeople,
    totalProfit,
    bookingProfit,
    walkinProfit,
  } = props

  const openWhatsapp = () => {
    window.open(`https://wa.me/${whatsapp}`, "_blank")
  }

  return (
    <div className="grid min-h-screen bg-[#060606] lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-black px-6 py-7">
        <h1 className="horror-title text-4xl tracking-widest text-red-700">
          MCFEST
        </h1>

        <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
          Admin Panel
        </p>

        <div className="mt-10 space-y-3">
          <Side
            active={adminTab === "dashboard"}
            text="🏠 Dashboard"
            onClick={() => setAdminTab("dashboard")}
          />

          <Side
            active={adminTab === "bookings"}
            text="🎟️ All Bookings"
            onClick={() => setAdminTab("bookings")}
          />

          <Side
            active={adminTab === "walkin"}
            text="🚶 Walk-in"
            onClick={() => setAdminTab("walkin")}
          />

          <Side
            active={adminTab === "settings"}
            text="⚙️ Event Settings"
            onClick={() => setAdminTab("settings")}
          />

          <Side
            active={adminTab === "reports"}
            text="📊 Reports / Profit"
            onClick={() => setAdminTab("reports")}
          />

          <Side
            text="📱 WhatsApp / Contact"
            onClick={openWhatsapp}
          />
        </div>

        <button
          onClick={() => setPage("home")}
          className="mt-10 w-full rounded-xl border border-red-800 px-5 py-3 text-red-500 hover:bg-red-900 hover:text-white"
        >
          View Website
        </button>
        <button
          onClick={() => {
            setIsAdminLoggedIn(false)
            setPage("home")
          }}
          className="mt-3 w-full rounded-xl bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-600"
        >
          Logout Admin
        </button>
      </aside>

      <main className="px-5 py-7 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h2 className="text-3xl font-black md:text-4xl">
            Dashboard Overview
          </h2>

          <div className="rounded-xl border border-white/10 bg-[#111] px-5 py-3 text-sm">
            {dateKhamis} - {dateJumaat}
          </div>
        </div>

        {adminTab === "dashboard" && (
          <>
            <Stats
              onlineBookings={onlineBookings}
              walkins={walkins}
              totalPeople={totalPeople}
              totalProfit={totalProfit}
            />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <BookingTable
                bookings={filteredBookings}
                setSelectedGroup={setSelectedGroup}
                markDone={markDone}
                deleteBooking={deleteBooking}
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
              />

              <div className="space-y-6">
                <ProfitBox
                  bookingProfit={bookingProfit}
                  walkinProfit={walkinProfit}
                  totalProfit={totalProfit}
                />

                <section className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
                  <h3 className="mb-4 text-xl font-black">
                    Quick Actions
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <button
                      onClick={() => setAdminTab("settings")}
                      className="quick-btn"
                    >
                      Event Settings
                    </button>

                    <button
                      onClick={() => setAdminTab("reports")}
                      className="quick-btn"
                    >
                      Reports / Profit
                    </button>

                    <button
                      onClick={openWhatsapp}
                      className="quick-btn"
                    >
                      WhatsApp / Contact
                    </button>

                    <button
                    onClick={() => setShowWalkinForm(true)}
                    className="quick-btn"
                  >
                    Add Walk-in
                  </button>
                      <button
                    onClick={exportParticipants}
                    className="quick-btn"
                  >
                    Export Excel
                  </button>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        {adminTab === "bookings" && (
          <BookingTable
            bookings={filteredBookings}
            setSelectedGroup={setSelectedGroup}
            markDone={markDone}
            deleteBooking={deleteBooking}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
          />
        )}

        {adminTab === "walkin" && (
          <WalkinPanel
            walkins={walkins}
            walkinName={walkinName}
            setWalkinName={setWalkinName}
            walkinPax={walkinPax}
            setWalkinPax={setWalkinPax}
            setShowWalkinForm={setShowWalkinForm}
            addWalkin={addWalkin}
            deleteBooking={deleteBooking}
            ticketPrice={ticketPrice}
          />
        )}

        {adminTab === "settings" && (
          <SettingsPanel
            ticketPrice={ticketPrice}
            saveSettings={saveSettings}
            paymentLink={paymentLink}
            setPaymentLink={setPaymentLink}
            setTicketPrice={setTicketPrice}
            dateKhamis={dateKhamis}
            setDateKhamis={setDateKhamis}
            dateJumaat={dateJumaat}
            setDateJumaat={setDateJumaat}
            dateSabtu={dateSabtu}
            setDateSabtu={setDateSabtu}
            whatsapp={whatsapp}
            setWhatsapp={setWhatsapp}
            slotLimits={slotLimits}
            setSlotLimits={setSlotLimits}
          />
        )}

        {adminTab === "reports" && (
          <ProfitBox
            bookingProfit={bookingProfit}
            walkinProfit={walkinProfit}
            totalProfit={totalProfit}
            big
          />
        )}
      </main>
    </div>
  )
}

function Stats({
  onlineBookings,
  walkins,
  totalPeople,
  totalProfit,
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      <Dash
        title="Total Booking Group"
        value={onlineBookings.length}
        sub="Group"
        icon="👥"
      />

      <Dash
        title="Total Walk-in"
        value={walkins.length}
        sub="Record"
        icon="🚶"
      />

      <Dash
        title="Total Orang"
        value={totalPeople}
        sub="Pax"
        icon="👥"
      />

      <Dash
        title="Total Profit"
        value={`RM${totalProfit}`}
        sub="Current"
        icon="💰"
        red
      />
    </div>
  )
}
function BookingTable({
  bookings,
  setSelectedGroup,
  markDone,
  deleteBooking,
  search,
  setSearch,
  filter,
  setFilter,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h3 className="text-xl font-black">Recent Bookings</h3>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking..."
            className="mini-field"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mini-field"
          >
            <option value="all">Semua</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Paid">Paid</option>
            <option value="Done">Done</option>
            <option value="booking">Booking</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="py-3">ID</th>
              <th>Tarikh</th>
              <th>Hari</th>
              <th>Session</th>
              <th>Nama Group</th>
              <th>Pax</th>
              <th>No. Telefon</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-5 text-gray-500">
                  Tiada booking
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/5">
                  <td className="py-4 text-red-400">{booking.ticketId}</td>
                  <td>{booking.date || "-"}</td>
                  <td>{booking.day}</td>
                  <td>{booking.session}</td>
                  <td className="font-bold">{booking.groupName}</td>
                  <td>{booking.pax || 5}</td>
                  <td>{booking.phone}</td>

                  <td>
                    {booking.paymentProofUrl ? (
                      <a
                        href={booking.paymentProofUrl}
                        target="_blank"
                        className="rounded bg-green-700 px-3 py-1 text-xs"
                      >
                        View Proof
                      </a>
                    ) : (
                      <span className="rounded bg-red-900 px-3 py-1 text-xs">
                        No Proof
                      </span>
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        booking.status === "Done"
                          ? "rounded bg-green-700 px-3 py-1 text-xs"
                          : booking.status === "Paid"
                          ? "rounded bg-blue-700 px-3 py-1 text-xs"
                          : "rounded bg-yellow-700 px-3 py-1 text-xs"
                      }
                    >
                      {booking.status}
                    </span>
                  </td>

                  <td className="flex gap-2 py-3">
                    <button
                      onClick={() => setSelectedGroup(booking)}
                      className="btn-red"
                    >
                      View
                    </button>

                    {booking.status !== "Done" && (
                      <button
                        onClick={() => markDone(booking.id)}
                        className="btn-green"
                      >
                        Done
                      </button>
                    )}

                    <button
                      onClick={() => deleteBooking(booking.id)}
                      className="btn-dark"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function WalkinPanel({
  walkins,
  walkinName,
  setWalkinName,
  walkinPax,
  setWalkinPax,
  addWalkin,
  setShowWalkinForm,
  deleteBooking,
  ticketPrice,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black">Walk-in List</h3>

        <button onClick={() => setShowWalkinForm(true)} className="btn-red">  
          + Add Walk-in
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
        <input
          value={walkinName}
          onChange={(e) => setWalkinName(e.target.value)}
          placeholder="Nama Group Walk-in"
          className="field"
        />

        <input
          type="number"
          min="1"
          value={walkinPax}
          onChange={(e) => setWalkinPax(e.target.value)}
          className="field"
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="py-3">ID</th>
              <th>Nama</th>
              <th>Pax</th>
              <th>Bayaran</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {walkins.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-5 text-gray-500">
                  Tiada walk-in
                </td>
              </tr>
            ) : (
              walkins.map((walkin) => (
                <tr key={walkin.id} className="border-b border-white/5">
                  <td className="py-4 text-red-400">{walkin.ticketId}</td>
                  <td>{walkin.groupName}</td>
                  <td>{walkin.pax}</td>
                  <td>RM{Number(walkin.pax || 0) * Number(ticketPrice)}</td>
                  <td>
                    <button
                      onClick={() => deleteBooking(walkin.id)}
                      className="btn-dark"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
function SettingsPanel({
  ticketPrice,
  saveSettings,
  paymentLink,
  setPaymentLink,
  setTicketPrice,
  dateKhamis,
  setDateKhamis,
  dateJumaat,
  setDateJumaat,
  dateSabtu,
  setDateSabtu,
  whatsapp,
  setWhatsapp,
  slotLimits,
  setSlotLimits,
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111]/90 p-5">
      <h3 className="mb-5 text-xl font-black">Event Settings</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Setting
          title="Harga Per Pax"
          value={ticketPrice}
          setValue={setTicketPrice}
          type="number"
        />

        <Setting
          title="Tarikh Khamis"
          value={dateKhamis}
          setValue={setDateKhamis}
        />

        <Setting
          title="Tarikh Jumaat"
          value={dateJumaat}
          setValue={setDateJumaat}
        />
        <Setting
          title="Tarikh Sabtu"
          value={dateSabtu}
          setValue={setDateSabtu}
        />

        <Setting
          title="WhatsApp"
          value={whatsapp}
          setValue={setWhatsapp}
        />
        <Setting
          title="Payment Link"
          value={paymentLink}
          setValue={setPaymentLink}
        />
        <Setting
          title="Khamis Pagi Max Group"
          value={slotLimits.khamisPagi}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              khamisPagi: Number(value),
            })
          }
          type="number"
        />

        <Setting
          title="Khamis Petang Max Group"
          value={slotLimits.khamisPetang}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              khamisPetang: Number(value),
            })
          }
          type="number"
        />

        <Setting
          title="Jumaat Pagi Max Group"
          value={slotLimits.jumaatPagi}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              jumaatPagi: Number(value),
            })
          }
          type="number"
        />

        <Setting
          title="Jumaat Petang Max Group"
          value={slotLimits.jumaatPetang}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              jumaatPetang: Number(value),
            })
          }
          type="number"
        />
        <Setting
          title="Sabtu Pagi Max Group"
          value={slotLimits.sabtuPagi}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              sabtuPagi: Number(value),
            })
          }
          type="number"
        />

        <Setting
          title="Sabtu Petang Max Group"
          value={slotLimits.sabtuPetang}
          setValue={(value) =>
            setSlotLimits({
              ...slotLimits,
              sabtuPetang: Number(value),
            })
          }
          type="number"
/>
      </div>
      <button
  onClick={saveSettings}
  className="mt-6 w-full rounded-xl bg-red-700 py-4 font-black uppercase tracking-widest hover:bg-red-600"
>
  Save Settings
</button>
    </section>
  )
}

function ProfitBox({
  bookingProfit,
  walkinProfit,
  totalProfit,
  big,
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#111]/90 p-5 ${
        big ? "max-w-xl" : ""
      }`}
    >
      <h3 className="mb-4 text-xl font-black">Ringkasan Profit</h3>

      <Profit label="Profit Booking" value={`RM${bookingProfit}`} />

      <Profit label="Profit Walk-in" value={`RM${walkinProfit}`} />

      <div className="mt-4 border-t border-white/10 pt-4 text-lg font-black text-red-500">
        Total Profit: RM{totalProfit}
      </div>
    </section>
  )
}

function Info({
  title,
  text,
  icon,
  middle,
}) {
  return (
    <div className="relative flex h-[115px] items-center justify-center text-center">
      {middle && (
        <>
          <div className="absolute left-0 top-6 h-[70px] w-px bg-red-900"></div>
          <div className="absolute right-0 top-6 h-[70px] w-px bg-red-900"></div>
        </>
      )}

      <div>
        <div className="mb-2 text-4xl text-red-600">{icon}</div>

        <h5 className="text-sm font-black uppercase tracking-wide text-white">
          {title}
        </h5>

        <p className="mt-1 text-xs leading-5 text-gray-300">{text}</p>
      </div>
    </div>
  )
}

function InfoSmall({
  title,
  text,
}) {
  return (
    <div className="h-fit rounded-xl border border-red-900/50 bg-black/60 p-5">
      <h5 className="text-lg font-black uppercase text-white">{title}</h5>

      <p className="mt-3 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  )
}

function Side({
  text,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "w-full rounded-xl bg-red-950 px-4 py-3 text-left text-sm font-bold"
          : "w-full rounded-xl px-4 py-3 text-left text-sm text-gray-400 hover:bg-white/5"
      }
    >
      {text}
    </button>
  )
}

function Dash({
  title,
  value,
  sub,
  red,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111]/90 p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400">
            {title}
          </p>

          <h3
            className={`mt-5 text-4xl font-black ${
              red ? "text-red-500" : ""
            }`}
          >
            {value}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{sub}</p>
        </div>

        <div className="text-3xl text-red-600">{icon}</div>
      </div>
    </div>
  )
}

function Setting({
  title,
  value,
  setValue,
  type = "text",
}) {
  return (
    <label className="block">
      <p className="mb-2 text-sm text-gray-400">{title}</p>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-red-900 bg-black p-3 outline-none"
      />
    </label>
  )
}

function Profit({
  label,
  value,
}) {
  return (
    <div className="flex justify-between border-b border-white/5 py-3 text-sm">
      <span className="text-gray-400">{label}</span>

      <span>{value}</span>
    </div>
  )
}

function Popup({
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-700 bg-black p-8">
        {children}
      </div>
    </div>
  )
}

export default App