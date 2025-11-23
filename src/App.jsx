import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Wallet, TrendingUp, TrendingDown, PieChart, Home, Trash2, 
  Utensils, Bus, ShoppingBag, Coffee, Home as HouseIcon, Stethoscope, 
  Briefcase, Gift, CreditCard, MoreHorizontal, X, Camera, Loader2, Sparkles,
  Download, Upload
} from 'lucide-react';

// --- ⚠️ 国内大模型 API 配置 (请在此处修改) ---
const AI_CONFIG = {
  // 1. 填入您的 API Key (例如智谱的 Key)
  apiKey: "ff1c9b7c8ede4bee994e030407396a75.8S73rNbiDENOJOcN", 
  
  // 2. 接口地址 (Base URL)
  baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",

  // 3. 模型名称
  model: "glm-4v-flash" 
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

// --- 🤖 通用 AI 调用函数 (OpenAI 格式) ---
const callDomesticAI = async (base64Image) => {
  const prompt = `
  你是一个智能记账助手。请分析这张收据或账单截图。
  请提取以下信息并严格以 JSON 格式返回（不要包含 markdown 代码块标记，只返回纯 JSON 字符串）：
  {
    "type": "expense" (支出) 或 "income" (收入),
    "amount": 金额 (数字，不要符号),
    "category": "分类ID (必须是以下之一: food, transport, shopping, entertainment, housing, medical, other_expense, salary, bonus, investment, other_income)",
    "date": "YYYY-MM-DD" (如果图中无年份默认今年，无日期默认今天),
    "note": "简短备注 (商家名或商品名)"
  }
  `;

  const payload = {
    model: AI_CONFIG.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:image/jpeg;base64,${base64Image}` 
            } 
          }
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

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("AI Request Failed:", error);
    throw error;
  }
};

// --- 组件 ---

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
        <button 
          onClick={() => onDelete(item.id)}
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
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
        
        {/* Header */}
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

        {/* Type Toggle */}
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
          {/* Amount Input */}
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

          {/* Categories Grid */}
          <div>
             <label className="text-xs text-gray-400 font-medium ml-1">分类</label>
             <div className="grid grid-cols-4 gap-3 mt-2">
               {currentCategories.map((cat) => (
                 <button
                   key={cat.id}
                   type="button"
                   onClick={() => setCategory(cat.id)}
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

          {/* Date & Note */}
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

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all mt-4"
          >
            确认
          </button>
        </form>
      </div>
    </div>
  );
};

const StatsView = ({ transactions, onImport }) => {
  const [viewType, setViewType] = useState('expense'); 
  const fileInputRef = useRef(null);

  // Filter and Aggregate
  const filteredTransactions = transactions.filter(t => t.type === viewType);
  const total = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryTotals = filteredTransactions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const categoryList = viewType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Transform to array and sort
  const statsData = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const catInfo = categoryList.find(c => c.id === catId) || { name: '未知', color: 'bg-gray-100 text-gray-600', icon: MoreHorizontal };
      return {
        ...catInfo,
        amount,
        percentage: total === 0 ? 0 : (amount / total) * 100
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Export Function
  const handleExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Import Function
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          if(window.confirm(`确认导入 ${importedData.length} 条数据？这将覆盖当前数据。`)) {
            onImport(importedData);
            alert("导入成功！");
          }
        } else {
          alert("文件格式不正确");
        }
      } catch (err) {
        alert("文件解析失败");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="pb-24 animate-fade-in">
      <div className="bg-white p-6 rounded-b-3xl shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">收支统计</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-full sm:w-64">
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setViewType('expense')}
          >
            支出排行
          </button>
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            onClick={() => setViewType('income')}
          >
            收入排行
          </button>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-1">总计{viewType === 'expense' ? '支出' : '收入'}</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="px-4 space-y-4 mb-8">
        {statsData.length > 0 ? (
          statsData.map((stat) => (
            <div key={stat.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${stat.color} bg-opacity-20`}>
                    <stat.icon size={14} />
                  </div>
                  <span className="font-medium text-gray-700">{stat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">{formatCurrency(stat.amount)}</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${viewType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">{stat.percentage.toFixed(1)}%</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
             <PieChart size={48} className="mb-2 opacity-20" />
             <p>本月暂无{viewType === 'expense' ? '支出' : '收入'}数据</p>
          </div>
        )}
      </div>

      {/* Backup & Restore Section */}
      <div className="px-4 mt-8">
        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider ml-1">数据备份</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Download size={18} />
            <span className="text-sm font-medium">导出账单</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Upload size={18} />
            <span className="text-sm font-medium">导入账单</span>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImport} 
            />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          您可以将导出的文件发送到其他设备，然后点击“导入”进行恢复。
        </p>
      </div>
    </div>
  );
};

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'stats'
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const fileInputRef = useRef(null);

  // Load data from LocalStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('expense_tracker_data');
      if (savedData) {
        setTransactions(JSON.parse(savedData));
      } else {
        // Initial Demo Data
        setTransactions([
          { id: '1', type: 'expense', amount: 35.00, category: 'food', date: new Date().toISOString().split('T')[0], note: '午餐' },
          { id: '2', type: 'expense', amount: 4.00, category: 'transport', date: new Date().toISOString().split('T')[0], note: '地铁' },
          { id: '3', type: 'income', amount: 8500.00, category: 'salary', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], note: '三月工资' },
        ]);
      }
    } catch (e) {
      console.error("Storage access error", e);
    }
    setLoaded(true);
  }, []);

  // Save data to LocalStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('expense_tracker_data', JSON.stringify(transactions));
    }
  }, [transactions, loaded]);

  const handleAddTransaction = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    setAiData(null); // Clear AI data after add
  };

  const handleDeleteTransaction = (id) => {
    if(window.confirm('确定要删除这条记录吗？')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };
  
  // New handler for manual import
  const handleImportData = (newData) => {
    setTransactions(newData);
  };

  const calculateTotals = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const { income, expense, balance } = calculateTotals();

  // Handle Image Upload & AI Analysis
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单校验 Key
    if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === "YOUR_API_KEY_HERE") {
      alert("请先在代码中配置您的国内大模型 API Key");
      return;
    }

    setIsAnalyzing(true);
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1]; // Remove prefix
      try {
        const result = await callDomesticAI(base64String);
        console.log("AI Result:", result);
        setAiData(result);
        setShowAddModal(true);
      } catch (error) {
        console.error("AI Analysis failed:", error);
        alert(`识别失败：${error.message || "请检查网络或Key是否正确"}`);
        setShowAddModal(true); // Still open modal even if AI fails
      } finally {
        setIsAnalyzing(false);
        // Reset file input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleImageUpload}
      />

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl flex flex-col items-center animate-bounce-slow">
             <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
             <p className="font-bold text-gray-800">AI 正在识别账单...</p>
             <p className="text-xs text-gray-500 mt-1">使用 {AI_CONFIG.model} 分析中</p>
           </div>
        </div>
      )}

      {/* --- Main Content Area --- */}
      {activeTab === 'home' && (
        <div className="animate-fade-in">
          {/* Header Card */}
          <div className="bg-emerald-600 text-white p-6 rounded-b-[2.5rem] shadow-lg shadow-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black opacity-5 blur-xl"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h1 className="text-emerald-100 text-sm font-medium mb-1">本月结余</h1>
                   <div className="text-4xl font-bold tracking-tight">
                     <span className="text-2xl opacity-80 mr-1">¥</span>
                     {balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                   </div>
                 </div>
                 <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                   <Wallet size={20} className="text-white" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1 text-emerald-100 text-xs mb-1">
                    <TrendingDown size={12} />
                    <span>总支出</span>
                  </div>
                  <div className="font-semibold text-lg">{expense.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-1 text-emerald-100 text-xs mb-1">
                    <TrendingUp size={12} />
                    <span>总收入</span>
                  </div>
                  <div className="font-semibold text-lg">{income.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="px-4 mt-6">
            <div className="flex justify-between items-end mb-4 px-1">
              <h2 className="text-lg font-bold text-gray-800">近期账单</h2>
              <span className="text-xs text-gray-400">最近 {transactions.length} 笔</span>
            </div>
            
            <div className="pb-24">
              {transactions.length > 0 ? (
                transactions.map(item => (
                  <TransactionItem 
                    key={item.id} 
                    item={item} 
                    onDelete={handleDeleteTransaction} 
                  />
                ))
              ) : (
                <div className="text-center py-10 opacity-50">
                  <Wallet size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400 text-sm">暂无记录，快去记一笔吧</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <StatsView transactions={transactions} onImport={handleImportData} />
      )}

      {/* --- Floating Action Buttons --- */}
      <div className="fixed bottom-24 right-4 z-40 max-w-md w-full mx-auto pointer-events-none flex flex-col items-end gap-3 pr-8">
        
        {/* Camera Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="pointer-events-auto bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-3 rounded-full shadow-lg shadow-gray-200 transition-transform active:scale-90 flex items-center justify-center"
          title="拍照智能识别"
        >
          <Camera size={24} />
        </button>

        {/* Add Button */}
        <button
          onClick={() => {
            setAiData(null);
            setShowAddModal(true);
          }}
          className="pointer-events-auto bg-gray-900 hover:bg-black text-white p-4 rounded-full shadow-xl shadow-gray-400/50 transition-transform active:scale-90 flex items-center justify-center group"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* --- Bottom Navigation --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-30 max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">明细</span>
        </button>

        <div className="w-12"></div> 

        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">统计</span>
        </button>
      </div>

      {/* --- Add Transaction Modal --- */}
      <AddTransactionModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTransaction}
        initialData={aiData}
      />
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-slow { animation: bounce 2s infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}