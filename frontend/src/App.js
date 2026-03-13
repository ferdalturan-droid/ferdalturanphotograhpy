import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  Truck, Users, Mail, FileText, CheckCircle2, MapPin,
  Wand2, Plus, Trash2, Clock, Weight, X, 
  Pause, RotateCcw, Download, Settings, ChevronDown, Calendar,
  Shield, Send, Eye, Phone, Car, BarChart3, Navigation, Edit2, LogOut,
  History, Building2, ChevronLeft, ChevronRight
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get current time in HH:MM format
const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

// Open address in maps
const openInMaps = (address) => {
  if (!address) return;
  const encodedAddress = encodeURIComponent(address + ", Denmark");
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
};

// ============= COMPONENTS =============

const StatCard = ({ icon: Icon, value, label, color = "primary", subtext = "" }) => {
  const colorClasses = {
    primary: "bg-slate-800 text-white",
    accent: "bg-amber-500 text-black",
    success: "bg-emerald-500 text-white",
    brand: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
  };

  return (
    <div 
      data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}
      className={`stat-card ${colorClasses[color]} rounded-xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-lg transition-all hover:scale-105`}
    >
      <Icon className="w-5 h-5 mb-1 opacity-80" />
      <span className="font-heading font-black text-2xl">{value}</span>
      <span className="text-xs opacity-80 font-medium">{label}</span>
      {subtext && <span className="text-xs opacity-60 mt-1">{subtext}</span>}
    </div>
  );
};

const PladsButton = ({ name, isSelected, onClick, tourCount = 0 }) => (
  <button
    data-testid={`plads-${name.toLowerCase().replace(/\s/g, '-')}`}
    onClick={onClick}
    className={`
      relative px-4 py-2 rounded-lg text-sm font-medium transition-all
      ${isSelected 
        ? "bg-red-600 text-white shadow-lg scale-105" 
        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-600"
      }
    `}
  >
    {name}
    {tourCount > 0 && (
      <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${isSelected ? "bg-white text-red-600" : "bg-red-600 text-white"}`}>
        {tourCount}
      </span>
    )}
  </button>
);

const TourRow = ({ tour, onUpdate, onDelete, onToggleOnWay, onToggleComplete, driverName, isGroupStart, isGroupEnd, isInGroup }) => {
  const [weight, setWeight] = useState(tour.weight || "");
  const [time, setTime] = useState(tour.time || "");

  const handleWeightChange = (e) => {
    const val = e.target.value;
    setWeight(val);
    if (val && parseFloat(val) > 0) {
      onUpdate(tour.id, { weight: parseFloat(val) || 0, completed: true, on_way: false });
    }
  };

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setTime(val);
    onUpdate(tour.id, { time: val });
  };

  useEffect(() => {
    if (tour.time !== time) setTime(tour.time || "");
  }, [tour.time]); // eslint-disable-line

  useEffect(() => {
    if (tour.weight !== undefined && tour.weight !== parseFloat(weight)) setWeight(tour.weight || "");
  }, [tour.weight]); // eslint-disable-line

  if (tour.is_pause) {
    return (
      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-border" data-testid={`tour-row-${tour.id}`}>
        <td colSpan="5" className="p-3 text-center font-bold text-slate-600 dark:text-slate-400">
          <Pause className="w-4 h-4 inline mr-2" />
          PAUSE
        </td>
        <td className="p-3 text-center font-mono text-sm">-</td>
        <td className="p-3 text-center font-mono text-sm font-bold">{tour.time || "45 min"}</td>
        <td className="p-3 text-center">
          <button onClick={() => onDelete(tour.id)} className="text-red-500 hover:text-red-600" data-testid={`delete-tour-${tour.id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }

  const rowClass = tour.completed 
    ? "bg-emerald-50 dark:bg-emerald-950/30" 
    : tour.on_way 
      ? "bg-amber-50 dark:bg-amber-950/30" 
      : tour.remark?.toLowerCase().includes("haster")
        ? "bg-red-50 dark:bg-red-950/30"
        : "";

  // Group border styling for same address tours - using box-shadow as border doesn't work well on tr
  const groupStyle = isInGroup 
    ? { boxShadow: 'inset 4px 0 0 0 #ef4444' }
    : {};

  // Add visual indicator for grouped rows
  const groupBgClass = isInGroup ? "bg-red-50/50 dark:bg-red-900/20" : "";

  return (
    <tr className={`${rowClass} ${groupBgClass} border-b border-border hover:bg-muted/50 transition-colors`} style={groupStyle} data-testid={`tour-row-${tour.id}`}>
      <td className="p-3 font-medium">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span>{tour.fraction}</span>
            {tour.is_same_day && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">SD</span>
            )}
            {tour.remark && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                tour.remark.toLowerCase().includes("haster") ? "bg-red-500 text-white" 
                : tour.remark.toLowerCase().includes("senere") ? "bg-orange-400 text-black"
                : "bg-slate-200 dark:bg-slate-700"
              }`}>{tour.remark}</span>
            )}
          </div>
          {tour.on_way && driverName && (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
              <Truck className="w-3 h-3" /> {driverName} kører
            </span>
          )}
        </div>
      </td>
      <td className="p-3 text-sm">{tour.facility}</td>
      <td className="p-3 text-sm">
        <button 
          onClick={() => openInMaps(tour.address)}
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-left"
          title="Åbn i kort"
        >
          <Navigation className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[150px]">{tour.address}</span>
        </button>
      </td>
      <td className="p-3 font-mono text-sm">{tour.container}</td>
      <td className="p-3 font-mono text-xs text-muted-foreground">
        {tour.open_from && tour.open_to ? `${tour.open_from}-${tour.open_to}` : ""}
      </td>
      <td className="p-3">
        <input type="number" value={weight} onChange={handleWeightChange} placeholder="kg"
          className="w-20 px-2 py-1 text-sm font-mono bg-background border border-input rounded focus:ring-2 focus:ring-red-500"
          data-testid={`weight-input-${tour.id}`} />
      </td>
      <td className="p-3">
        <input type="time" value={time} onChange={handleTimeChange}
          className="w-24 px-2 py-1 text-sm font-mono bg-background border border-input rounded focus:ring-2 focus:ring-red-500"
          data-testid={`time-input-${tour.id}`} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          {!tour.completed && (
            <button onClick={() => onToggleOnWay(tour.id)}
              className={`p-1.5 rounded ${tour.on_way ? "bg-amber-500 text-black" : "bg-slate-200 dark:bg-slate-700"} hover:opacity-80`}
              title={tour.on_way ? "På vej" : "Start tur"} data-testid={`onway-btn-${tour.id}`}>
              <Truck className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onToggleComplete(tour.id)}
            className={`p-1.5 rounded ${tour.completed ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"} hover:opacity-80`}
            title={tour.completed ? "Færdig" : "Markér færdig"} data-testid={`complete-btn-${tour.id}`}>
            {tour.completed ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(tour.id)}
            className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200"
            data-testid={`delete-tour-${tour.id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ============= ADMIN PAGE COMPONENT =============

const AdminPage = ({ onLogout }) => {
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [editingDriver, setEditingDriver] = useState(null);
  const [newDriver, setNewDriver] = useState({ name: "", plate: "", area: "", phone: "", email: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New state for plads management and history
  const [pladsList, setPladsList] = useState([]);
  const [newPladsName, setNewPladsName] = useState("");
  const [reportHistory, setReportHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule"); // schedule, drivers, plads, history
  
  // Driver schedule state - each driver's assigned plads for today
  const [driverSchedule, setDriverSchedule] = useState({}); // { driverId: "pladsName" or "FRI" }
  
  // Weekly schedule state
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });
  const [weeklySchedule, setWeeklySchedule] = useState({}); // { "driverId-date": "plads" }
  const [viewMode, setViewMode] = useState("daily"); // "daily" or "weekly"

  // Get week dates
  const getWeekDates = useCallback(() => {
    const dates = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [weekStart]);

  const fetchWeeklySchedule = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/schedule?week_start=${weekStart}`);
      const scheduleMap = {};
      res.data.forEach(s => {
        scheduleMap[`${s.driver_id}-${s.date}`] = s.plads;
      });
      setWeeklySchedule(scheduleMap);
    } catch (e) {
      console.error("Error fetching weekly schedule:", e);
    }
  }, [weekStart]);

  const fetchData = useCallback(async () => {
    try {
      const [driversRes, statsRes, messagesRes, pladsRes, historyRes] = await Promise.all([
        axios.get(`${API}/drivers`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/messages`),
        axios.get(`${API}/plads`),
        axios.get(`${API}/reports/history?days=30`)
      ]);
      setDrivers(driversRes.data);
      setStats(statsRes.data);
      setMessages(messagesRes.data);
      setPladsList(pladsRes.data);
      setReportHistory(historyRes.data);
      
      // Initialize driver schedule with their default area
      const initialSchedule = {};
      driversRes.data.forEach(d => {
        initialSchedule[d.id] = d.area || "";
      });
      setDriverSchedule(initialSchedule);
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchWeeklySchedule(); }, [fetchWeeklySchedule]);

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.plate) {
      toast.error("Navn og nummerplade er påkrævet");
      return;
    }
    try {
      await axios.post(`${API}/drivers`, newDriver);
      setNewDriver({ name: "", plate: "", area: "", phone: "", email: "" });
      setShowAddForm(false);
      fetchData();
      toast.success("Chauffør tilføjet");
    } catch (e) {
      toast.error("Fejl ved tilføjelse");
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;
    try {
      await axios.put(`${API}/drivers/${editingDriver.id}`, editingDriver);
      setEditingDriver(null);
      fetchData();
      toast.success("Chauffør opdateret");
    } catch (e) {
      toast.error("Fejl ved opdatering");
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm("Er du sikker?")) return;
    try {
      await axios.delete(`${API}/drivers/${driverId}`);
      fetchData();
      toast.success("Chauffør slettet");
    } catch (e) {
      toast.error("Fejl ved sletning");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDriver || !messageText.trim()) {
      toast.error("Vælg chauffør og skriv besked");
      return;
    }
    try {
      await axios.post(`${API}/messages`, {
        to_driver_id: selectedDriver,
        content: messageText
      });
      setMessageText("");
      fetchData();
      toast.success("Besked sendt");
    } catch (e) {
      toast.error("Fejl ved afsendelse");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await axios.delete(`${API}/messages/${msgId}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlads = async () => {
    if (!newPladsName.trim()) {
      toast.error("Indtast plads navn");
      return;
    }
    try {
      await axios.post(`${API}/plads`, { name: newPladsName.trim() });
      setNewPladsName("");
      fetchData();
      toast.success("Plads tilføjet");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Fejl ved tilføjelse");
    }
  };

  const handleDeletePlads = async (pladsId) => {
    if (!window.confirm("Er du sikker på at du vil slette denne plads?")) return;
    try {
      await axios.delete(`${API}/plads/${pladsId}`);
      fetchData();
      toast.success("Plads slettet");
    } catch (e) {
      toast.error("Fejl ved sletning");
    }
  };

  // Handle driver schedule change
  const handleScheduleChange = (driverId, plads) => {
    setDriverSchedule(prev => ({
      ...prev,
      [driverId]: plads
    }));
  };

  // Send email to single driver
  const sendEmailToDriver = (driver, plads) => {
    if (!driver.email) {
      toast.error(`${driver.name} har ingen email adresse`);
      return;
    }
    
    const today = new Date().toLocaleDateString("da-DK", { weekday: 'long', day: 'numeric', month: 'long' });
    const subject = encodeURIComponent(`Arbejdsplan - ${today}`);
    
    let body;
    if (plads === "FRI") {
      body = encodeURIComponent(`Hej ${driver.name},\n\nDu har fri i dag (${today}).\n\nMed venlig hilsen\nKORKMAN2 - ILK Company ApS`);
    } else {
      body = encodeURIComponent(`Hej ${driver.name},\n\nDu skal arbejde i ${plads} i dag (${today}).\n\nVogn: ${driver.plate}\n\nMed venlig hilsen\nKORKMAN2 - ILK Company ApS`);
    }
    
    window.open(`mailto:${driver.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success(`Mail åbnet for ${driver.name}`);
  };

  // Send email to all drivers with assignments
  const sendEmailToAllDrivers = () => {
    const driversWithEmail = drivers.filter(d => d.email);
    if (driversWithEmail.length === 0) {
      toast.error("Ingen chauffører har email adresse");
      return;
    }
    
    const today = new Date().toLocaleDateString("da-DK", { weekday: 'long', day: 'numeric', month: 'long' });
    const subject = encodeURIComponent(`Arbejdsplan - ${today}`);
    
    // Build schedule list
    let scheduleList = drivers.map(d => {
      const plads = driverSchedule[d.id] || "Ikke tildelt";
      return `${d.name}: ${plads === "FRI" ? "FRI" : plads}`;
    }).join("\n");
    
    const body = encodeURIComponent(`Arbejdsplan for ${today}:\n\n${scheduleList}\n\nMed venlig hilsen\nKORKMAN2 - ILK Company ApS`);
    
    // Join all emails
    const emails = driversWithEmail.map(d => d.email).join(",");
    
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank');
    toast.success("Mail åbnet for alle chauffører");
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + (direction * 7));
    setWeekStart(current.toISOString().split('T')[0]);
  };

  // Handle weekly schedule change
  const handleWeeklyScheduleChange = (driverId, date, plads) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [`${driverId}-${date}`]: plads
    }));
  };

  // Save weekly schedule
  const saveWeeklySchedule = async () => {
    const schedules = [];
    const weekDates = getWeekDates();
    
    drivers.forEach(driver => {
      weekDates.forEach(date => {
        const key = `${driver.id}-${date}`;
        const plads = weeklySchedule[key];
        if (plads) {
          schedules.push({
            driver_id: driver.id,
            driver_name: driver.name,
            date: date,
            plads: plads
          });
        }
      });
    });
    
    if (schedules.length === 0) {
      toast.error("Ingen ændringer at gemme");
      return;
    }
    
    try {
      await axios.post(`${API}/schedule/bulk`, { schedules });
      toast.success(`${schedules.length} planlægninger gemt!`);
      fetchWeeklySchedule();
    } catch (e) {
      toast.error("Fejl ved gemning");
    }
  };

  // Send weekly email
  const sendWeeklyEmailToAllDrivers = () => {
    const driversWithEmail = drivers.filter(d => d.email);
    if (driversWithEmail.length === 0) {
      toast.error("Ingen chauffører har email adresse");
      return;
    }
    
    const weekDates = getWeekDates();
    const dayNames = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];
    
    const startDate = new Date(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const subject = encodeURIComponent(`Ugeplan - Uge ${getWeekNumber(startDate)}`);
    
    // Build schedule for each driver
    let scheduleList = drivers.map(driver => {
      const driverSchedule = weekDates.map((date, idx) => {
        const plads = weeklySchedule[`${driver.id}-${date}`] || "-";
        return `${dayNames[idx]}: ${plads}`;
      }).join(", ");
      return `${driver.name}: ${driverSchedule}`;
    }).join("\n");
    
    const body = encodeURIComponent(`Ugeplan (${startDate.toLocaleDateString("da-DK")} - ${endDate.toLocaleDateString("da-DK")}):\n\n${scheduleList}\n\nMed venlig hilsen\nKORKMAN2 - ILK Company ApS`);
    
    const emails = driversWithEmail.map(d => d.email).join(",");
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank');
    toast.success("Ugeplan mail åbnet");
  };

  // Get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900" data-testid="admin-page">
      {/* Admin Header */}
      <header className="bg-slate-800 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="font-heading font-bold text-xl">KORKMAN2 Admin</h1>
              <p className="text-xs text-slate-400">ILK Company ApS</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">
            <LogOut className="w-4 h-4" /> Log ud
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab("schedule")}
              className={`px-4 py-3 font-medium transition-colors ${activeTab === "schedule" ? "text-red-600 border-b-2 border-red-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Calendar className="w-4 h-4 inline mr-2" /> Planlægning
            </button>
            <button 
              onClick={() => setActiveTab("drivers")}
              className={`px-4 py-3 font-medium transition-colors ${activeTab === "drivers" ? "text-red-600 border-b-2 border-red-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Users className="w-4 h-4 inline mr-2" /> Chauffører
            </button>
            <button 
              onClick={() => setActiveTab("plads")}
              className={`px-4 py-3 font-medium transition-colors ${activeTab === "plads" ? "text-red-600 border-b-2 border-red-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Building2 className="w-4 h-4 inline mr-2" /> Genbrugsplads
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-4 py-3 font-medium transition-colors ${activeTab === "history" ? "text-red-600 border-b-2 border-red-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <History className="w-4 h-4 inline mr-2" /> Historik
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600" /> Oversigt
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{drivers.length}</div>
              <div className="text-sm text-muted-foreground">Chauffører</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {stats.reduce((sum, s) => sum + s.completed_tours, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Fuldførte ture</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.reduce((sum, s) => sum + s.total_weight, 0).toLocaleString()} kg
              </div>
              <div className="text-sm text-muted-foreground">Total vægt</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">{messages.length}</div>
              <div className="text-sm text-muted-foreground">Beskeder</div>
            </div>
          </div>
        </section>

        {/* Schedule / Planning Tab */}
        {activeTab === "schedule" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" /> Planlægning
              </h2>
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode("daily")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "daily" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Daglig
                </button>
                <button 
                  onClick={() => setViewMode("weekly")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "weekly" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Ugentlig
                </button>
              </div>
            </div>
            
            {viewMode === "daily" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("da-DK", { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <button 
                  onClick={sendEmailToAllDrivers}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Mail className="w-4 h-4" /> Send til alle
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium px-3">
                  Uge {getWeekNumber(new Date(weekStart))} - {new Date(weekStart).toLocaleDateString("da-DK", { day: 'numeric', month: 'short' })} til {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toLocaleDateString("da-DK", { day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={saveWeeklySchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-2"
                >
                  <Download className="w-4 h-4" /> Gem uge
                </button>
                <button 
                  onClick={sendWeeklyEmailToAllDrivers}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Mail className="w-4 h-4" /> Send ugeplan
                </button>
              </div>
            )}
          </div>
          
          {/* Daily View */}
          {viewMode === "daily" && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                  <th className="p-3 text-left">Chauffør</th>
                  <th className="p-3 text-left">Nummerplade</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Arbejdssted</th>
                  <th className="p-3 text-center">Send Mail</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id} className={`border-b hover:bg-slate-50 dark:hover:bg-slate-900 ${driverSchedule[driver.id] === "FRI" ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
                    <td className="p-3">
                      <span className="font-medium">{driver.name}</span>
                    </td>
                    <td className="p-3 font-mono text-sm">{driver.plate}</td>
                    <td className="p-3">
                      {driver.email ? (
                        <span className="text-sm text-blue-600">{driver.email}</span>
                      ) : (
                        <span className="text-sm text-red-500 italic">Ingen email</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select 
                        value={driverSchedule[driver.id] || ""}
                        onChange={(e) => handleScheduleChange(driver.id, e.target.value)}
                        className={`px-3 py-2 border rounded-lg w-full max-w-xs ${driverSchedule[driver.id] === "FRI" ? "bg-green-100 text-green-800 font-bold" : ""}`}
                      >
                        <option value="">Vælg plads...</option>
                        <option value="FRI" className="bg-green-100 text-green-800 font-bold">🏖️ FRI (Fridag)</option>
                        {pladsList.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => sendEmailToDriver(driver, driverSchedule[driver.id])}
                        disabled={!driver.email || !driverSchedule[driver.id]}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!driver.email ? "Ingen email" : !driverSchedule[driver.id] ? "Vælg plads først" : "Send mail"}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Daily Summary */}
          <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-600">Arbejder:</span>{" "}
                <span className="font-bold text-blue-600">
                  {drivers.filter(d => driverSchedule[d.id] && driverSchedule[d.id] !== "FRI").length}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-600">FRI:</span>{" "}
                <span className="font-bold text-green-600">
                  {drivers.filter(d => driverSchedule[d.id] === "FRI").length}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-600">Ikke tildelt:</span>{" "}
                <span className="font-bold text-amber-600">
                  {drivers.filter(d => !driverSchedule[d.id]).length}
                </span>
              </div>
            </div>
          </div>
          </>
          )}
          
          {/* Weekly View */}
          {viewMode === "weekly" && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                  <th className="p-3 text-left sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 min-w-[150px]">Chauffør</th>
                  {getWeekDates().map((date, idx) => {
                    const d = new Date(date);
                    const dayNames = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={date} className={`p-2 text-center min-w-[100px] ${isWeekend ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                        <div className="font-bold">{dayNames[d.getDay()]}</div>
                        <div className="text-xs text-muted-foreground">{d.getDate()}/{d.getMonth() + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-2 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r">
                      <div className="font-medium text-sm">{driver.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{driver.plate}</div>
                    </td>
                    {getWeekDates().map((date) => {
                      const d = new Date(date);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const key = `${driver.id}-${date}`;
                      const value = weeklySchedule[key] || "";
                      
                      return (
                        <td key={date} className={`p-1 ${isWeekend ? "bg-slate-50 dark:bg-slate-800/50" : ""} ${value === "FRI" ? "bg-green-50 dark:bg-green-950/30" : ""}`}>
                          <select 
                            value={value}
                            onChange={(e) => handleWeeklyScheduleChange(driver.id, date, e.target.value)}
                            className={`w-full px-1 py-1.5 text-xs border rounded ${value === "FRI" ? "bg-green-100 text-green-800 font-bold" : "bg-white dark:bg-slate-700"}`}
                          >
                            <option value="">-</option>
                            <option value="FRI">🏖️ FRI</option>
                            {pladsList.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Weekly Summary */}
          <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-wrap gap-6 text-sm">
              {getWeekDates().map((date) => {
                const d = new Date(date);
                const dayNames = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
                const working = drivers.filter(dr => {
                  const val = weeklySchedule[`${dr.id}-${date}`];
                  return val && val !== "FRI";
                }).length;
                const fri = drivers.filter(dr => weeklySchedule[`${dr.id}-${date}`] === "FRI").length;
                
                return (
                  <div key={date} className="text-center">
                    <div className="font-medium text-xs text-slate-500">{dayNames[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-blue-600 font-bold">{working}</span>
                      <span className="text-green-600 font-bold">{fri} fri</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}
        </section>
        )}

        {/* Drivers Management */}
        {activeTab === "drivers" && (
        <>
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" /> Chauffører
            </h2>
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Plus className="w-4 h-4" /> Tilføj ny
            </button>
          </div>

          {/* Add Driver Form */}
          {showAddForm && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <input type="text" value={newDriver.name} onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                  placeholder="Navn" className="px-3 py-2 border rounded-lg" />
                <input type="text" value={newDriver.plate} onChange={(e) => setNewDriver({...newDriver, plate: e.target.value})}
                  placeholder="Nummerplade" className="px-3 py-2 border rounded-lg font-mono" />
                <input type="text" value={newDriver.area} onChange={(e) => setNewDriver({...newDriver, area: e.target.value})}
                  placeholder="Område" className="px-3 py-2 border rounded-lg" />
                <input type="text" value={newDriver.phone} onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                  placeholder="Telefon" className="px-3 py-2 border rounded-lg" />
                <input type="email" value={newDriver.email} onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                  placeholder="Email" className="px-3 py-2 border rounded-lg" />
                <button onClick={handleAddDriver} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Gem
                </button>
              </div>
            </div>
          )}

          {/* Drivers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                  <th className="p-3 text-left">Navn</th>
                  <th className="p-3 text-left">Nummerplade</th>
                  <th className="p-3 text-left">Område</th>
                  <th className="p-3 text-left">Telefon</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-center">Ture i dag</th>
                  <th className="p-3 text-center">Total ture</th>
                  <th className="p-3 text-center">Total kg</th>
                  <th className="p-3 text-center">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => {
                  const driverStats = stats.find(s => s.driver_id === driver.id) || {};
                  const isEditing = editingDriver?.id === driver.id;
                  
                  return (
                    <tr key={driver.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="p-3">
                        {isEditing ? (
                          <input type="text" value={editingDriver.name} 
                            onChange={(e) => setEditingDriver({...editingDriver, name: e.target.value})}
                            className="px-2 py-1 border rounded w-full" />
                        ) : (
                          <span className="font-medium">{driver.name}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {isEditing ? (
                          <input type="text" value={editingDriver.plate}
                            onChange={(e) => setEditingDriver({...editingDriver, plate: e.target.value})}
                            className="px-2 py-1 border rounded w-full" />
                        ) : driver.plate}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="text" value={editingDriver.area}
                            onChange={(e) => setEditingDriver({...editingDriver, area: e.target.value})}
                            className="px-2 py-1 border rounded w-full" />
                        ) : driver.area}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="text" value={editingDriver.phone || ""}
                            onChange={(e) => setEditingDriver({...editingDriver, phone: e.target.value})}
                            className="px-2 py-1 border rounded w-full" />
                        ) : driver.phone || "-"}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="email" value={editingDriver.email || ""}
                            onChange={(e) => setEditingDriver({...editingDriver, email: e.target.value})}
                            className="px-2 py-1 border rounded w-full" />
                        ) : driver.email ? (
                          <span className="text-blue-600 text-xs">{driver.email}</span>
                        ) : (
                          <span className="text-red-500 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          {driverStats.today_completed || 0}/{driverStats.today_tours || 0}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">{driverStats.completed_tours || 0}</td>
                      <td className="p-3 text-center">{(driverStats.total_weight || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={handleUpdateDriver} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingDriver(null)} className="p-1.5 bg-slate-500 text-white rounded hover:bg-slate-600">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditingDriver(driver)} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteDriver(driver.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Messages Section - inside drivers tab */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-red-600" /> Send besked til chauffør
            </h2>
          </div>
          <div className="p-4">
            <div className="flex gap-3 mb-4">
              <select value={selectedDriver || ""} onChange={(e) => setSelectedDriver(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg">
                <option value="">Vælg chauffør...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                placeholder="Skriv besked..." className="flex-[2] px-3 py-2 border rounded-lg" />
              <button onClick={handleSendMessage} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
            
            {/* Message History */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{msg.to_driver_name}</div>
                    <div className="text-sm text-muted-foreground">{msg.content}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(msg.created_at).toLocaleString("da-DK")}</div>
                  </div>
                  <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Ingen beskeder</p>
              )}
            </div>
          </div>
        </section>
        </>
        )}

        {/* Plads Management Tab */}
        {activeTab === "plads" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" /> Genbrugsplads / Områder
            </h2>
          </div>
          <div className="p-4">
            {/* Add new plads */}
            <div className="flex gap-3 mb-6">
              <input 
                type="text" 
                value={newPladsName} 
                onChange={(e) => setNewPladsName(e.target.value)}
                placeholder="Ny plads/by navn..."
                className="flex-1 px-4 py-2 border rounded-lg"
                onKeyDown={(e) => e.key === "Enter" && handleAddPlads()}
              />
              <button 
                onClick={handleAddPlads}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tilføj
              </button>
            </div>
            
            {/* Plads list */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pladsList.map(plads => (
                <div key={plads.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="font-medium">{plads.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeletePlads(plads.id)}
                    className="p-1 text-red-500 hover:text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {pladsList.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  Ingen plads tilføjet endnu
                </p>
              )}
            </div>
          </div>
        </section>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-red-600" /> Rapport Historik (sidste 30 dage)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                  <th className="p-3 text-left">Dato</th>
                  <th className="p-3 text-center">Ture</th>
                  <th className="p-3 text-center">Færdig</th>
                  <th className="p-3 text-center">Total kg</th>
                  <th className="p-3 text-center">Chauffører</th>
                </tr>
              </thead>
              <tbody>
                {reportHistory.map(day => (
                  <tr key={day.date} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3 font-medium">
                      {new Date(day.date).toLocaleDateString("da-DK", { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {day.total_tours}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        {day.completed_tours}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      {day.total_weight.toLocaleString()} kg
                    </td>
                    <td className="p-3 text-center">
                      {day.driver_count}
                    </td>
                  </tr>
                ))}
                {reportHistory.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">
                      Ingen historik fundet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary stats */}
          {reportHistory.length > 0 && (
            <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportHistory.reduce((sum, d) => sum + d.total_tours, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total ture</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {reportHistory.reduce((sum, d) => sum + d.completed_tours, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Fuldførte</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {reportHistory.reduce((sum, d) => sum + d.total_weight, 0).toLocaleString()} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Total vægt</div>
                </div>
              </div>
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
};

// ============= MAIN APP =============

function App() {
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // Data state
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [tours, setTours] = useState([]);
  const [reportId, setReportId] = useState("");
  const [pladsList, setPladsList] = useState([]); // Dynamic plads list from DB
  
  // Filter state
  const [selectedPlads, setSelectedPlads] = useState("");
  
  // Form state
  const [driverName, setDriverName] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [customPlads, setCustomPlads] = useState("");
  const [notes, setNotes] = useState("");
  
  // Mail parse state
  const [mailText, setMailText] = useState("");
  const [parsing, setParsing] = useState(false);
  
  // Manual tour form
  const [manualFraction, setManualFraction] = useState("");
  const [manualFacility, setManualFacility] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualContainer, setManualContainer] = useState("");
  const [isSameDay, setIsSameDay] = useState(false);
  
  // Driver dropdown
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  
  // Messages for driver
  const [driverMessages, setDriverMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);

  // Get plads names from dynamic list
  const pladsOptions = pladsList.map(p => p.name);

  // ============= API CALLS =============

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/drivers`);
      setDrivers(res.data);
    } catch (e) {
      console.error("Error fetching drivers:", e);
    }
  }, []);

  const fetchTours = useCallback(async () => {
    if (!reportId) return;
    try {
      const res = await axios.get(`${API}/tours?report_id=${reportId}`);
      setTours(res.data);
    } catch (e) {
      console.error("Error fetching tours:", e);
    }
  }, [reportId]);

  const seedData = useCallback(async () => {
    try {
      await axios.post(`${API}/seed`);
      fetchDrivers();
      // Fetch plads list
      const pladsRes = await axios.get(`${API}/plads`);
      setPladsList(pladsRes.data);
    } catch (e) {
      console.error("Error seeding data:", e);
    }
  }, [fetchDrivers]);

  // ============= EFFECTS =============

  useEffect(() => { seedData(); }, [seedData]);
  useEffect(() => { if (reportId) fetchTours(); }, [reportId, fetchTours]);

  useEffect(() => {
    const initReport = async () => {
      if (!reportId) {
        try {
          // First check if there's already a report for today
          const existingRes = await axios.get(`${API}/reports?date=${reportDate}`);
          if (existingRes.data && existingRes.data.length > 0) {
            // Use existing report
            setReportId(existingRes.data[0].id);
          } else {
            // Create new report
            const res = await axios.post(`${API}/reports`, {
              report_date: reportDate,
              start_time: "07:00"
            });
            setReportId(res.data.id);
          }
        } catch (e) {
          console.error("Error initializing report:", e);
        }
      }
    };
    initReport();
  }, [reportDate, reportId]);

  // ============= HANDLERS =============

  const handleAdminLogin = async () => {
    try {
      const res = await axios.post(`${API}/admin/login`, { username: adminUser, password: adminPass });
      if (res.data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        toast.success("Admin login successful");
      }
    } catch (e) {
      toast.error("Forkert brugernavn eller adgangskode");
    }
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setDriverName(driver.name);
    setVehicleReg(driver.plate);
    // Automatically set plads based on driver's area
    if (driver.area) {
      setSelectedPlads(driver.area);
      toast.success(`${driver.name} valgt - ${driver.area}`);
    } else {
      toast.success(`${driver.name} valgt`);
    }
    setShowDriverDropdown(false);
    
    // Fetch messages for this driver
    fetchDriverMessages(driver.id);
  };
  
  const fetchDriverMessages = async (driverId) => {
    try {
      const res = await axios.get(`${API}/messages?driver_id=${driverId}`);
      const unreadMessages = res.data.filter(m => !m.read);
      setDriverMessages(unreadMessages);
      if (unreadMessages.length > 0) {
        setShowMessages(true);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };
  
  const markMessageRead = async (messageId) => {
    try {
      await axios.put(`${API}/messages/${messageId}/read`);
      setDriverMessages(driverMessages.filter(m => m.id !== messageId));
      if (driverMessages.length <= 1) {
        setShowMessages(false);
      }
    } catch (e) {
      console.error("Error marking message read:", e);
    }
  };

  const handleParseMail = async () => {
    if (!mailText.trim()) { toast.error("Indsæt mail tekst først"); return; }
    
    setParsing(true);
    try {
      const res = await axios.post(`${API}/parse-mail`, { text: mailText, report_id: reportId });
      
      if (res.data.success && res.data.tours.length > 0) {
        // Sort tours by facility to group same facilities together
        const sortedTours = [...res.data.tours].sort((a, b) => {
          if (a.facility === b.facility) {
            return a.address.localeCompare(b.address);
          }
          return a.facility.localeCompare(b.facility);
        });
        
        const toursToCreate = sortedTours.map(t => ({
          ...t,
          plads: selectedPlads,
          driver_id: selectedDriver?.id || "",
          driver_name: driverName,
          report_id: reportId
        }));
        
        const createdRes = await axios.post(`${API}/tours/bulk`, toursToCreate);
        setTours([...tours, ...createdRes.data]);
        setMailText("");
        
        // Show grouped summary
        const grouped = res.data.grouped_by_facility;
        const facilityCount = Object.keys(grouped).length;
        toast.success(`${res.data.count} ture tilføjet! (${facilityCount} anlæg)`);
      } else {
        toast.error("Kunne ikke parse mail");
      }
    } catch (e) {
      toast.error("Fejl ved parsing af mail");
    } finally {
      setParsing(false);
    }
  };

  const handleAddManualTour = async () => {
    if (!manualFraction || !manualFacility) { toast.error("Udfyld fraktion og modtageanlæg!"); return; }
    
    const activeTours = tours.filter(t => !t.is_pause).length;
    if (activeTours >= 20) { toast.error("Maksimum 20 ture!"); return; }
    
    console.log("Adding tour with plads:", selectedPlads, "reportId:", reportId);
    
    try {
      const res = await axios.post(`${API}/tours`, {
        date: reportDate,
        fraction: manualFraction,
        facility: manualFacility,
        address: manualAddress,
        container: manualContainer,
        is_same_day: isSameDay,
        plads: selectedPlads || "",
        driver_id: selectedDriver?.id || "",
        driver_name: driverName,
        report_id: reportId
      });
      console.log("Tour added:", res.data);
      setTours(prevTours => [...prevTours, res.data]);
      setManualFraction(""); setManualFacility(""); setManualAddress(""); setManualContainer(""); setIsSameDay(false);
      toast.success("Tur tilføjet");
    } catch (e) {
      console.error("Error adding tour:", e);
      toast.error("Fejl ved tilføjelse");
    }
  };

  const handleAddPause = async (minutes = 45) => {
    const now = new Date();
    const pauseStart = now.toTimeString().slice(0, 5);
    const pauseEnd = new Date(now.getTime() + minutes * 60000).toTimeString().slice(0, 5);
    
    try {
      const res = await axios.post(`${API}/tours/pause?report_id=${reportId}&plads=${selectedPlads}&driver_id=${selectedDriver?.id || ""}&driver_name=${driverName}`);
      await axios.put(`${API}/tours/${res.data.id}`, { time: `${pauseStart}-${pauseEnd}` });
      setTours([...tours, { ...res.data, time: `${pauseStart}-${pauseEnd}` }]);
      toast.success(`Pause: ${pauseStart} - ${pauseEnd} (${minutes} min)`);
    } catch (e) {
      toast.error("Fejl ved pause");
    }
  };

  const handleUpdateTour = async (tourId, update) => {
    try {
      const res = await axios.put(`${API}/tours/${tourId}`, update);
      setTours(tours.map(t => t.id === tourId ? res.data : t));
    } catch (e) {
      console.error("Error updating tour:", e);
    }
  };

  const handleToggleOnWay = async (tourId) => {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;
    const newOnWay = !tour.on_way;
    const currentTime = newOnWay ? getCurrentTime() : tour.time;
    await handleUpdateTour(tourId, { on_way: newOnWay, time: currentTime });
    if (newOnWay) toast.success(`${driverName || "Chauffør"} er på vej!`);
  };

  const handleToggleComplete = async (tourId) => {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;
    await handleUpdateTour(tourId, { completed: !tour.completed, on_way: false });
  };

  const handleDeleteTour = async (tourId) => {
    try {
      await axios.delete(`${API}/tours/${tourId}`);
      setTours(tours.filter(t => t.id !== tourId));
      toast.success("Tur slettet");
    } catch (e) {
      toast.error("Fejl ved sletning");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Slet alle ture?")) return;
    try {
      await axios.delete(`${API}/tours/report/${reportId}`);
      setTours([]);
      toast.success("Alle ture slettet");
    } catch (e) {
      toast.error("Fejl");
    }
  };

  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Use ALL tours from current report
      const allTours = tours;
      const pdfTours = allTours.filter(t => !t.is_pause);
      const pdfPauses = allTours.filter(t => t.is_pause);
      const pdfCompletedTours = pdfTours.filter(t => t.completed);
      const pdfTotalWeight = pdfTours.reduce((sum, t) => sum + (t.weight || 0), 0);
      
      // RED HEADER
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("KORKMAN2", 14, 18);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("ILK Company ApS", 14, 26);
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("KØRSELSRAPPORT", pageWidth - 14, 18, { align: "right" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const formattedDate = reportDate.split("-").reverse().join(".");
      doc.text(`Dato: ${formattedDate}`, pageWidth - 14, 26, { align: "right" });
      
      // DRIVER INFO BOX
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.rect(14, 42, pageWidth - 28, 32);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("CHAUFFØR NAVN:", 18, 50);
      doc.text("VOGN NR.:", 18, 58);
      doc.text("PLADS:", 18, 66);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(driverName || "Ikke valgt", 55, 50);
      doc.text(vehicleReg || "-", 55, 58);
      doc.text(selectedPlads || customPlads || "-", 55, 66);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("START TID:", pageWidth / 2 + 10, 50);
      doc.text("SLUT TID:", pageWidth / 2 + 10, 58);
      doc.text("TID I ALT:", pageWidth / 2 + 10, 66);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(startTime || "-", pageWidth / 2 + 40, 50);
      doc.text(endTime || "-", pageWidth / 2 + 40, 58);
      
      let totalTimeStr = "-";
      if (startTime && endTime) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        totalTimeStr = `${Math.floor(totalMinutes / 60)}t ${totalMinutes % 60}m`;
      }
      doc.text(totalTimeStr, pageWidth / 2 + 40, 66);
      
      // TOURS TABLE - Include ALL tours including completed
      const tableData = [];
      
      // Sort: completed FIRST (at top), then pending tours
      const pdfSortedTours = [...tours].sort((a, b) => {
        // Pauses at end
        if (a.is_pause && !b.is_pause) return 1;
        if (!a.is_pause && b.is_pause) return -1;
        // Completed tours FIRST
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return 0;
      });
      
      pdfSortedTours.forEach((tour) => {
        if (tour.is_pause) {
          tableData.push([
            { content: "PAUSE", colSpan: 4, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', halign: 'center' } },
            { content: tour.time || "45 min", styles: { fillColor: [241, 245, 249] } },
            { content: "", styles: { fillColor: [241, 245, 249] } }
          ]);
        } else {
          let fractionText = tour.fraction || "";
          if (tour.is_same_day) fractionText += " [SD]";
          
          // Completed tours get green background
          const completedStyle = tour.completed ? { fillColor: [220, 252, 231] } : {};
          const sameDayStyle = tour.is_same_day ? { textColor: [220, 38, 38], fontStyle: 'bold' } : {};
          
          tableData.push([
            { content: fractionText, styles: { ...completedStyle, ...sameDayStyle } },
            { content: tour.facility || "", styles: completedStyle },
            { content: (tour.address || "").substring(0, 35), styles: completedStyle },
            { content: tour.container || "", styles: completedStyle },
            { content: tour.weight ? `${tour.weight} kg` : "", styles: completedStyle },
            { content: tour.time || "", styles: completedStyle }
          ]);
        }
      });
      
      // Fill to 20 rows
      const emptyRowsNeeded = Math.max(0, 20 - tableData.length);
      for (let i = 0; i < emptyRowsNeeded; i++) {
        tableData.push(["", "", "", "", "", ""]);
      }
      
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 82,
          head: [[
            { content: "FRAKTION", styles: { fillColor: [220, 38, 38] } },
            { content: "AFLÆS. STED", styles: { fillColor: [220, 38, 38] } },
            { content: "ADRESSE", styles: { fillColor: [220, 38, 38] } },
            { content: "CONT.", styles: { fillColor: [220, 38, 38] } },
            { content: "VÆGT", styles: { fillColor: [220, 38, 38] } },
            { content: "TIL", styles: { fillColor: [220, 38, 38] } }
          ]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 38, 38], lineWidth: 0.1 },
          columnStyles: {
            0: { cellWidth: 35 }, 1: { cellWidth: 40 }, 2: { cellWidth: 50 },
            3: { cellWidth: 20 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 }
          }
          // Note: alternateRowStyles removed to preserve completed tour green background
        });
      }
      
      // STATS BOX
      const finalY = doc.lastAutoTable?.finalY || 200;
      
      doc.setDrawColor(220, 38, 38);
      doc.rect(14, finalY + 5, pageWidth - 28, 20);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("TURE:", 18, finalY + 13);
      doc.text("FÆRDIG:", 50, finalY + 13);
      doc.text("TOTAL KG:", 90, finalY + 13);
      doc.text("PAUSE:", 140, finalY + 13);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`${pdfTours.length}`, 32, finalY + 13);
      doc.text(`${pdfCompletedTours.length}`, 68, finalY + 13);
      doc.text(`${pdfTotalWeight}`, 115, finalY + 13);
      doc.text(`${pdfPauses.length}`, 158, finalY + 13);
      
      // NOTES
      if (notes) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("BEMÆRKNINGER:", 18, finalY + 22);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(notes, pageWidth - 40), 18, finalY + 28);
      }
      
      // FOOTER
      doc.setFontSize(7);
      doc.setTextColor(128, 128, 128);
      doc.text(`Genereret: ${new Date().toLocaleString("da-DK")} | KORKMAN2 - ILK Company ApS`, pageWidth / 2, pageHeight - 8, { align: "center" });
      
      doc.save(`korselsrapport_${formattedDate}_${driverName || "rapport"}.pdf`);
      toast.success("PDF genereret!");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Fejl: " + error.message);
    }
  };

  // ============= COMPUTED VALUES =============

  const activeTours = tours.filter(t => !t.is_pause);
  const completedTours = activeTours.filter(t => t.completed);
  const totalWeight = activeTours.reduce((sum, t) => sum + (t.weight || 0), 0);
  const remainingTours = 20 - activeTours.length;
  
  // Filter tours by plads - only show tours that belong to selected plads
  const filteredTours = selectedPlads 
    ? tours.filter(t => t.plads === selectedPlads)
    : tours;
  
  // Sort: group by facility first, then on_way, then normal, then completed
  const sortedTours = [...filteredTours].sort((a, b) => {
    // Pauses at the end
    if (a.is_pause && !b.is_pause) return 1;
    if (!a.is_pause && b.is_pause) return -1;
    
    // On way tours first
    if (a.on_way && !b.on_way) return -1;
    if (!a.on_way && b.on_way) return 1;
    
    // Completed tours at end
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Group by facility (same facility together)
    if (a.facility !== b.facility) {
      return (a.facility || "").localeCompare(b.facility || "");
    }
    
    // Same facility - sort by address
    if (a.address !== b.address) {
      return (a.address || "").localeCompare(b.address || "");
    }
    
    // Haster (urgent) first within same facility
    const aHaster = a.remark?.toLowerCase().includes("haster") ? 0 : 1;
    const bHaster = b.remark?.toLowerCase().includes("haster") ? 0 : 1;
    return aHaster - bHaster;
  });
  
  const calculateTotalTime = () => {
    if (!startTime || !endTime) return "0t 0m";
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    return `${Math.floor(totalMinutes / 60)}t ${totalMinutes % 60}m`;
  };
  
  // Get tour count per plads
  const getPladsTourCount = (plads) => tours.filter(t => t.plads === plads && !t.is_pause).length;

  // ============= RENDER =============

  // Admin login modal
  if (showAdminLogin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Toaster position="top-right" richColors />
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-red-600" />
            <h2 className="font-heading font-bold text-2xl">Admin Login</h2>
          </div>
          <div className="space-y-4">
            <input type="text" value={adminUser} onChange={(e) => setAdminUser(e.target.value)}
              placeholder="Brugernavn" className="w-full px-4 py-3 border rounded-lg" />
            <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Adgangskode" className="w-full px-4 py-3 border rounded-lg"
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} />
            <button onClick={handleAdminLogin}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
              Log ind
            </button>
            <button onClick={() => setShowAdminLogin(false)}
              className="w-full py-2 text-slate-500 hover:text-slate-700">
              Annuller
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin page
  if (isAdmin) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AdminPage onLogout={() => setIsAdmin(false)} />
      </>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-testid="app-container">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-red-600 text-white py-4 px-4 shadow-lg" data-testid="app-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl">KORKMAN2</h1>
            <p className="text-red-100 text-xs">ILK Company ApS - Kørselsrapport</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Message notification */}
            {driverMessages.length > 0 && (
              <button onClick={() => setShowMessages(!showMessages)}
                className="relative p-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 animate-pulse">
                <Mail className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-800 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {driverMessages.length}
                </span>
              </button>
            )}
            <button onClick={() => setShowAdminLogin(true)} 
              className="p-2 bg-red-700 rounded-lg hover:bg-red-800" title="Admin">
              <Shield className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Message Box for Driver */}
      {showMessages && driverMessages.length > 0 && (
        <div className="bg-amber-50 border-b-4 border-amber-500 py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">Beskeder fra admin</h3>
              <button onClick={() => setShowMessages(false)} className="ml-auto text-amber-600 hover:text-amber-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {driverMessages.map(msg => (
                <div key={msg.id} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-500 flex items-start justify-between">
                  <div>
                    <p className="text-slate-800">{msg.content}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(msg.created_at).toLocaleString("da-DK")}
                    </p>
                  </div>
                  <button onClick={() => markMessageRead(msg.id)}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> OK
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-border shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-3 justify-center md:justify-start">
          <StatCard icon={Truck} value={completedTours.length} label="Færdig" color="success" subtext={`af ${activeTours.length}`} />
          <StatCard icon={Weight} value={totalWeight} label="Total kg" color="accent" />
          <StatCard icon={Clock} value={calculateTotalTime()} label="Arbejdstid" color="primary" />
          <StatCard icon={FileText} value={remainingTours} label="Plads tilbage" color="info" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Driver Selection Box */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" /> Chauffør & Køretøj
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Driver Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Chauffør</label>
                <button onClick={() => setShowDriverDropdown(!showDriverDropdown)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg text-left flex items-center justify-between hover:border-red-400">
                  <span className={selectedDriver ? "font-medium" : "text-muted-foreground"}>
                    {selectedDriver ? selectedDriver.name : "Vælg chauffør..."}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDriverDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {drivers.map(driver => (
                      <button key={driver.id} onClick={() => handleSelectDriver(driver)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between">
                        <span>{driver.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{driver.plate}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Vehicle */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Vogn nr.</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Car className="w-4 h-4 text-slate-500" />
                  <span className="font-mono">{vehicleReg || "-"}</span>
                </div>
              </div>
              
              {/* Time */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    onFocus={() => { if (!startTime) setStartTime(getCurrentTime()); }}
                    className="w-full px-3 py-2 border rounded-lg font-mono" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Slut</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    onFocus={() => { if (!endTime) setEndTime(getCurrentTime()); }}
                    className="w-full px-3 py-2 border rounded-lg font-mono" />
                </div>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Dato</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono" />
              </div>
            </div>
          </div>
        </section>

        {/* Plads Selection */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" /> Vælg Plads / Område
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <PladsButton name="Alle" isSelected={!selectedPlads} onClick={() => setSelectedPlads("")} 
                tourCount={activeTours.length} />
              {pladsOptions.map(plads => (
                <PladsButton key={plads} name={plads} isSelected={selectedPlads === plads}
                  onClick={() => setSelectedPlads(plads)} tourCount={getPladsTourCount(plads)} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Andet:</span>
              <input type="text" value={customPlads}
                onChange={(e) => { setCustomPlads(e.target.value); if (e.target.value) setSelectedPlads(""); }}
                placeholder="Skriv plads..." className="px-3 py-1 border rounded-lg text-sm" />
            </div>
          </div>
        </section>

        {/* Mail Parse */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border-2 border-red-500/50 shadow-lg">
          <div className="p-4 border-b border-border bg-red-50 dark:bg-red-950/20 rounded-t-xl">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-600" /> Indsæt ture fra mail
            </h2>
          </div>
          <div className="p-4">
            <textarea value={mailText} onChange={(e) => setMailText(e.target.value)}
              placeholder="Kopier ture fra mail her (tab-separated format)..."
              className="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono text-sm resize-none" />
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleParseMail} disabled={parsing}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                <Wand2 className="w-5 h-5" /> {parsing ? "Parser..." : "+ Tilføj ture"}
              </button>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <span className="px-2 text-sm text-muted-foreground">Pause:</span>
                <button onClick={() => handleAddPause(15)}
                  className="px-3 py-2 bg-white dark:bg-slate-600 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-500 text-sm">
                  15 min
                </button>
                <button onClick={() => handleAddPause(30)}
                  className="px-3 py-2 bg-white dark:bg-slate-600 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-500 text-sm">
                  30 min
                </button>
                <button onClick={() => handleAddPause(45)}
                  className="px-3 py-2 bg-white dark:bg-slate-600 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-500 text-sm">
                  45 min
                </button>
              </div>
              <button onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-500">
                <Trash2 className="w-5 h-5" /> Slet alt
              </button>
            </div>
          </div>
        </section>

        {/* Manual Tour */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" /> Tilføj tur manuelt
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input type="text" value={manualFraction} onChange={(e) => setManualFraction(e.target.value)}
                placeholder="Fraktion" className="px-3 py-2 border rounded-lg" />
              <input type="text" value={manualFacility} onChange={(e) => setManualFacility(e.target.value)}
                placeholder="Modtageanlæg" className="px-3 py-2 border rounded-lg" />
              <input type="text" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Adresse" className="px-3 py-2 border rounded-lg" />
              <input type="text" value={manualContainer} onChange={(e) => setManualContainer(e.target.value)}
                placeholder="Container" className="px-3 py-2 border rounded-lg font-mono" />
              <label className="flex items-center gap-2 px-3 py-2">
                <input type="checkbox" checked={isSameDay} onChange={(e) => setIsSameDay(e.target.checked)}
                  className="w-4 h-4 rounded" />
                <span className="text-sm">Samme dag</span>
              </label>
            </div>
            <button onClick={handleAddManualTour}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
              <Plus className="w-4 h-4" /> Tilføj tur
            </button>
          </div>
        </section>

        {/* Tours Table */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" /> 
              {selectedPlads ? `Ture - ${selectedPlads}` : "Dagens ture"}
            </h2>
            <div className="text-sm">
              <span className="font-bold text-emerald-600">{completedTours.length}</span>
              <span className="text-muted-foreground"> færdig / </span>
              <span className="font-bold">{activeTours.length}</span>
              <span className="text-muted-foreground"> total</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b">
                  <th className="p-3 text-left font-semibold">FRAKTION</th>
                  <th className="p-3 text-left font-semibold">MODTAGEANLÆG</th>
                  <th className="p-3 text-left font-semibold">ADRESSE</th>
                  <th className="p-3 text-left font-semibold">CONT.</th>
                  <th className="p-3 text-left font-semibold">ÅBEN</th>
                  <th className="p-3 text-left font-semibold">VÆGT</th>
                  <th className="p-3 text-left font-semibold">TID</th>
                  <th className="p-3 text-left font-semibold">HANDLINGER</th>
                </tr>
              </thead>
              <tbody>
                {sortedTours.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-muted-foreground">
                      <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      Ingen ture {selectedPlads && `i ${selectedPlads}`}
                    </td>
                  </tr>
                ) : (
                  sortedTours.map((tour, index) => {
                    // Check if this tour shares address with others (for grouping)
                    const addressCount = sortedTours.filter(t => 
                      !t.is_pause && t.address && t.address === tour.address
                    ).length;
                    const isInGroup = addressCount > 1 && !tour.is_pause && tour.address;
                    
                    // Find group boundaries
                    const prevTour = index > 0 ? sortedTours[index - 1] : null;
                    const nextTour = index < sortedTours.length - 1 ? sortedTours[index + 1] : null;
                    const isGroupStart = isInGroup && (!prevTour || prevTour.address !== tour.address);
                    const isGroupEnd = isInGroup && (!nextTour || nextTour.address !== tour.address);
                    
                    return (
                      <TourRow 
                        key={tour.id} 
                        tour={tour} 
                        onUpdate={handleUpdateTour}
                        onDelete={handleDeleteTour} 
                        onToggleOnWay={handleToggleOnWay}
                        onToggleComplete={handleToggleComplete} 
                        driverName={driverName}
                        isInGroup={isInGroup}
                        isGroupStart={isGroupStart}
                        isGroupEnd={isGroupEnd}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" /> Bemærkninger
            </h2>
          </div>
          <div className="p-4">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Skriv noter her..." maxLength={500}
              className="w-full h-24 px-4 py-3 border rounded-lg resize-none" />
            <div className="mt-2 text-right text-xs text-muted-foreground">{notes.length}/500</div>
          </div>
        </section>
      </main>

      {/* PDF Footer */}
      <footer className="sticky bottom-0 bg-white dark:bg-slate-800 border-t p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-center">
          <button onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg">
            <Download className="w-5 h-5" /> Generer PDF
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
