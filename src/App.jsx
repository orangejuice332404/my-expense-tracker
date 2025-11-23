import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Wallet, TrendingUp, TrendingDown, PieChart, Home, Trash2, 
  Utensils, Bus, ShoppingBag, Coffee, Home as HouseIcon, Stethoscope, 
  Briefcase, Gift, CreditCard, MoreHorizontal, X, Camera, Loader2, Sparkles,
  Download, Upload, ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon,
  FileJson
} from 'lucide-react';

// --- ⚠️ 国内大模型 API 配置 ---
const AI_CONFIG = {
  // 请将此处替换为您申请的智谱 API Key
  apiKey: "ff1c9b7c8ede4bee994e030407396a75.8S73rNbiDENOJOcN", 
  
  baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  
  // ✅ 已根据您的要求，修改为 GLM-4.5-Flash
  model: "glm-4.5-flash" 
};

// --- 配置数据 ---
const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'transport', name: '交通', icon: Bus, color: 'bg-blue-100 text-blue-600' },
  { id: 'shopping', name: '购物', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { id: 'entertainment', name: '娱乐', icon: Coffee, color: 'bg-purple-100 text-purple-600' },
  { id: 'housing', name: '居住', icon: HouseIcon, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'medical', name: '医疗', icon: Stethoscope, color: 'bg-red-100 text-red-600' },
  { id: 'other_expense', name: '其他', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: Briefcase, color: 'bg-green-100 text-green-600' },
  { id: 'bonus', name: '奖金', icon: Gift, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'investment', name: '理财', icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'other_income', name: '其他', icon: CreditCard, color: 'bg-gray-100 text-gray-600' },
];

// --- 工具函数 ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return '今天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 获取某年某月的天数
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
// 获取某年某月第一天是星期几 (0-6)
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// --- AI 调用函数 ---
const callDomesticAI = async (base64Image) => {
  const prompt = `
  你是一个智能记账助手。请分析这张收据或账单截图。
  请提取以下信息并严格以 JSON 格式返回：
  {
    "type": "expense" (支出) 或 "income" (收入),
    "amount": 金额 (数字，不要符号),
    "category": "分类ID (从 food, transport, shopping, entertainment, housing, medical, other_expense, salary, bonus, investment, other_income 中选)",
    "date": "YYYY-MM-DD" (默认今年/今天),
    "note": "简短备注"
  }
  `;

  const payload = {
    model: AI_CONFIG.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ]
  };

  try {
    const response = await fetch(AI_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("API Error");
    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    throw error;
  }
};

// --- 子组件 ---

const TransactionItem = ({ item, onDelete }) => {
  const isExpense = item.type === 'expense';
  const categoryList = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const category = categoryList.find(c => c.id === item.category) || categoryList[categoryList.length - 1];
  const Icon = category.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${category.color}`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{category.name}</span>
          <span className="text-xs text-gray-400">
            {formatDate(item.date)} {item.note && `· ${item.note}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${isExpense ? 'text-gray-900' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(item.amount).replace('CN¥', '')}
        </span>
        <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const BudgetModal = ({ isOpen, onClose, currentBudget, onSave }) => {
  const [amount, setAmount] = useState(currentBudget);

  useEffect(() => { setAmount(currentBudget) }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[300px] p-6 rounded-2xl shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold mb-4">设置每月预算</h3>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 bg-gray-50 rounded-xl mb-4 text-xl font-bold border border-gray-200 focus:border-emerald-500 outline-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-gray-600">取消</button>
          <button onClick={() => { onSave(Number(amount)); onClose(); }} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium">保存</button>
        </div>
      </div>
    </div>
  );
};

const CalendarWidget = ({ currentDate, transactions, onDateSelect }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }
  
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dailyTrans = transactions.filter(t => t.date === dateStr);
    const hasIncome = dailyTrans.some(t => t.type === 'income');
    const dailyExpense = dailyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    days.push(
      <div key={d} className="flex flex-col items-center justify-start h-12 py-1 relative cursor-pointer hover:bg-gray-50 rounded-lg" onClick={() => onDateSelect && onDateSelect(dateStr)}>
        <span className={`text-xs font-medium ${dailyTrans.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{d}</span>
        {dailyExpense > 0 && (
          <span className="text-[8px] text-rose-500 font-bold -mt-0.5">-{Math.round(dailyExpense)}</span>
        )}
        {hasIncome && !dailyExpense && (
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-xs text-gray-400 font-medium">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
};

// 增加 onExport 和 onImportTrigger 属性
const StatsView = ({ transactions, onExport, onImportTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('expense');

  const monthlyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
  });

  const filteredByType = monthlyTransactions.filter(t => t.type === viewType);
  const total = filteredByType.reduce((acc, curr) => acc + curr.amount, 0);
  const categoryTotals = filteredByType.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  const categoryList = viewType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const statsData = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const catInfo = categoryList.find(c => c.id === catId) || { name: '其他', color: 'bg-gray-100', icon: MoreHorizontal };
      return { ...catInfo, amount, percentage: total === 0 ? 0 : (amount / total) * 100 };
    })
    .sort((a, b) => b.amount - a.amount);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="pb-24 animate-fade-in px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"><ChevronLeft size={20} /></button>
        <div className="text-lg font-bold text-gray-800 flex items-center gap-2">
           <CalendarIcon size={18} className="text-emerald-600"/>
           {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </div>
        <button onClick={nextMonth} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"><ChevronRight size={20} /></button>
      </div>

      <CalendarWidget 
        currentDate={currentDate} 
        transactions={monthlyTransactions} 
      />

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="flex bg-gray-100 p-1 rounded-lg mb-4 w-full">
          <button 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${viewType === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setViewType('expense')}
          >
            本月支出
          </button>
          <button 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${viewType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            onClick={() => setViewType('income')}
          >
            本月收入
          </button>
        </div>
        <div className="text-center">
           <span className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {statsData.map((stat) => (
          <div key={stat.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
             <div className={`p-2 rounded-full ${stat.color} bg-opacity-20`}>
                <stat.icon size={16} />
             </div>
             <div className="flex-1">
               <div className="flex justify-between text-sm mb-1">
                 <span className="font-medium">{stat.name}</span>
                 <span className="font-bold">{formatCurrency(stat.amount)}</span>
               </div>
               <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${viewType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${stat.percentage}%` }}></div>
               </div>
             </div>
          </div>
        ))}
        {statsData.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">本月没有{viewType === 'expense' ? '支出' : '收入'}记录</div>
        )}
      </div>

      {/* --- 新增：数据管理/备份区域 --- */}
      <div className="border-t border-gray-200 pt-6 pb-4">
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">数据管理 (防丢失)</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onExport}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-3 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Download size={16} />
            <span className="text-xs font-medium">导出备份</span>
          </button>
          
          <button 
            onClick={onImportTrigger}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-3 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Upload size={16} />
            <span className="text-xs font-medium">恢复数据</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          更新版本前建议点击“导出备份”，将文件保存在手机中。
        </p>
      </div>
    </div>
  );
};

const AddTransactionModal = ({ isOpen, onClose, onAdd, initialData }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount || '');
        setCategory(initialData.category || (initialData.type === 'income' ? 'other_income' : 'other_expense'));
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setNote(initialData.note || '');
      } else {
        setType('expense');
        setCategory(EXPENSE_CATEGORIES[0].id);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, initialData]);

  // Sync default category
  useEffect(() => {
    if (!initialData && isOpen) {
        if (type === 'expense' && !EXPENSE_CATEGORIES.find(c => c.id === category)) {
            setCategory(EXPENSE_CATEGORIES[0].id);
        } else if (type === 'income' && !INCOME_CATEGORIES.find(c => c.id === category)) {
            setCategory(INCOME_CATEGORIES[0].id);
        }
    }
  }, [type, isOpen, category, initialData]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onAdd({
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      date,
      note
    });
    onClose();
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">记一笔</h2>
            {initialData && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                <Sparkles size={10} />
                AI已识别
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            onClick={() => setType('expense')}
          >
            支出
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            onClick={() => setType('income')}
          >
            收入
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium ml-1">金额</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">¥</span>
              <input 
                type="number" 
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-2xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
             <label className="text-xs text-gray-400 font-medium ml-1">分类</label>
             <div className="grid grid-cols-4 gap-3 mt-2">
               {currentCategories.map((cat) => (
                 <button
                   key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                   className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${category === cat.id ? 'bg-emerald-50 ring-2 ring-emerald-500' : 'hover:bg-gray-50'}`}
                 >
                   <div className={`p-2 rounded-full ${cat.color} bg-opacity-50`}>
                     <cat.icon size={18} />
                   </div>
                   <span className="text-xs text-gray-600 truncate w-full text-center">{cat.name}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium ml-1">日期</label>
              <div className="relative mt-1">
                 <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex-[2]">
              <label className="text-xs text-gray-400 font-medium ml-1">备注 (选填)</label>
              <input 
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：晚餐 AA"
                className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all mt-4">
            确认
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0); // 新增：月预算状态
  const [loaded, setLoaded] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null); // 新增：JSON 导入引用

  // Load data
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('expense_tracker_data');
      if (savedData) setTransactions(JSON.parse(savedData));
      else {
        // Init Data
        setTransactions([
          { id: '1', type: 'expense', amount: 35.00, category: 'food', date: new Date().toISOString().split('T')[0], note: '午餐' },
          { id: '2', type: 'expense', amount: 4.00, category: 'transport', date: new Date().toISOString().split('T')[0], note: '地铁' }
        ]);
      }

      const savedBudget = localStorage.getItem('expense_monthly_budget');
      if (savedBudget) setMonthlyBudget(Number(savedBudget));
    } catch (e) { console.error(e); }
    setLoaded(true);
  }, []);

  // Save data
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('expense_tracker_data', JSON.stringify(transactions));
      localStorage.setItem('expense_monthly_budget', monthlyBudget.toString());
    }
  }, [transactions, monthlyBudget, loaded]);

  const handleAddTransaction = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    setAiData(null); 
  };

  const handleDeleteTransaction = (id) => {
    if(window.confirm('确定要删除这条记录吗？')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleImportData = (newData) => { setTransactions(newData); };
  
  const handleExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
           if(window.confirm(`该操作会覆盖当前所有数据，确认恢复备份？`)) {
             handleImportData(importedData);
             alert("恢复成功！");
           }
        } else { alert("文件格式错误"); }
      } catch (err) { alert("文件解析失败"); }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === "YOUR_API_KEY_HERE") {
      alert("请配置 API Key"); return;
    }
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await callDomesticAI(reader.result.split(',')[1]);
        setAiData(result);
        setShowAddModal(true);
      } catch (error) {
        alert("识别失败: " + error.message);
        setShowAddModal(true);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Calculations for current month dashboard
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
     const d = new Date(t.date);
     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentMonthIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  const remainingBudget = monthlyBudget - currentMonthExpense;
  const budgetProgress = monthlyBudget > 0 ? Math.min((currentMonthExpense / monthlyBudget) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
      
      {/* Hidden Inputs */}
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
      <input type="file" accept=".json" ref={jsonInputRef} className="hidden" onChange={handleImport} />

      {isAnalyzing && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl flex flex-col items-center animate-bounce-slow">
             <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
             <p className="font-bold text-gray-800">AI 正在识别账单...</p>
           </div>
        </div>
      )}

      {activeTab === 'home' && (
        <div className="animate-fade-in">
          {/* Header Card with Budget */}
          <div className="bg-emerald-600 text-white p-6 rounded-b-[2.5rem] shadow-lg shadow-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                 <div onClick={() => setShowBudgetModal(true)} className="cursor-pointer active:opacity-80 transition-opacity">
                   <div className="flex items-center gap-1 text-emerald-100 text-sm font-medium mb-1">
                      <span>本月剩余预算</span>
                      <Settings size={14} className="opacity-70" />
                   </div>
                   <div className="text-4xl font-bold tracking-tight">
                     <span className="text-2xl opacity-80 mr-1">¥</span>
                     {monthlyBudget > 0 ? remainingBudget.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '--'}
                   </div>
                 </div>
                 <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                   <Wallet size={20} className="text-white" />
                 </div>
              </div>

              {monthlyBudget > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-emerald-100 mb-1">
                    <span>已用 {((currentMonthExpense/monthlyBudget)*100).toFixed(0)}%</span>
                    <span>预算 {monthlyBudget}</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white'}`} 
                      style={{ width: `${budgetProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1 text-emerald-100 text-xs mb-1"><TrendingDown size={12} /><span>本月支出</span></div>
                  <div className="font-semibold text-lg">{currentMonthExpense.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1 text-emerald-100 text-xs mb-1"><TrendingUp size={12} /><span>本月收入</span></div>
                  <div className="font-semibold text-lg">{currentMonthIncome.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="text-lg font-bold text-gray-800">近期账单</h2>
            </div>
            <div className="pb-24">
              {transactions.length > 0 ? (
                transactions.slice(0, 10).map(item => (
                  <TransactionItem key={item.id} item={item} onDelete={handleDeleteTransaction} />
                ))
              ) : (
                <div className="text-center py-10 opacity-50"><p>暂无记录</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <StatsView 
          transactions={transactions} 
          onExport={handleExport}
          onImportTrigger={() => jsonInputRef.current?.click()}
        />
      )}

      {/* FAB */}
      <div className="fixed bottom-24 right-4 z-40 max-w-md w-full mx-auto pointer-events-none flex flex-col items-end gap-3 pr-8">
        <button onClick={() => fileInputRef.current?.click()} className="pointer-events-auto bg-emerald-100 text-emerald-700 p-3 rounded-full shadow-lg transition-transform active:scale-90 flex items-center justify-center">
          <Camera size={24} />
        </button>
        {/* 修复后的黑色加号按钮：大小与上方相机一致 (p-3, size 24, shadow-lg) */}
        <button onClick={() => { setAiData(null); setShowAddModal(true); }} className="pointer-events-auto bg-gray-900 text-white p-3 rounded-full shadow-lg transition-transform active:scale-90 flex items-center justify-center group">
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-30 max-w-md mx-auto">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">明细</span>
        </button>
        <div className="w-12"></div> 
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">统计</span>
        </button>
      </div>

      <AddTransactionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTransaction} initialData={aiData} />
      <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} currentBudget={monthlyBudget} onSave={setMonthlyBudget} />
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-bounce-slow { animation: bounce 2s infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
