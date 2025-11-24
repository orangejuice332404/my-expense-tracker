import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Wallet, TrendingUp, TrendingDown, PieChart, Home, Trash2, 
  Utensils, Bus, ShoppingBag, Coffee, Home as HouseIcon, Stethoscope, 
  Briefcase, Gift, CreditCard, MoreHorizontal, X, Camera, Loader2, Sparkles,
  Download, Upload, ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon,
  LineChart, Lock, User, LogOut, Eye, EyeOff
} from 'lucide-react';

// --- ⚠️ 国内大模型 API 配置 ---
const AI_CONFIG = {
  apiKey: "ff1c9b7c8ede4bee994e030407396a75.8S73rNbiDENOJOcN", // 记得填入您的 Key
  baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  model: "glm-4v-flash" 
};

// --- 🎨 自定义图标组件 ---
const WeChatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M8.25 2C4.8 2 2 4.5 2 7.6c0 1.8.9 3.4 2.3 4.5-.1.5-.6 1.8-.7 2 0 .1.1.2.2.1 1-.6 2.3-1.3 2.6-1.5.6.2 1.2.3 1.8.3.1 0 .3 0 .4 0-.1 2.9 2.7 5.3 6.2 5.3 1 0 1.9-.2 2.8-.5.3.2 1.6.9 2.6 1.5.1.1.2 0 .2-.1-.1-.3-.5-1.5-.7-2 1.4-1 2.3-2.7 2.3-4.5 0-3.1-2.8-5.6-6.2-5.6-3.1 0-5.8 2-6.1 4.7C9.3 11.9 9.7 12 10.1 12c3.9 0 7.1-2.8 7.1-6.2 0-.1 0-.1 0-.2C15.7 3.4 12.2 2 8.25 2zM6 6.5c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zm4 0c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zm4.5 7c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm4 0c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z"/>
  </svg>
);

const AlipayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.5 2h-13C3.6 2 2 3.6 2 5.5v13C2 20.4 3.6 22 5.5 22h13c1.9 0 3.5-1.6 3.5-3.5v-13C22 3.6 20.4 2 18.5 2zM9.5 11h5c.3 0 .5.2.5.5s-.2.5-.5.5h-2.2c.2 1.2.5 2.3 1 3.3.3-.3.6-.7.8-1.1.1-.3.4-.4.7-.3.3.1.4.4.3.7-.3.5-.7 1-1.1 1.4 1.2 1.1 2.8 1.8 4.5 2 .3 0 .5.3.5.6 0 .3-.2.5-.6.5-1.9-.2-3.6-1-5-2.3-1.2 1.1-2.6 2-4.1 2.5-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 1.3-.4 2.6-1.2 3.6-2.1-.6-1.1-1-2.3-1.2-3.6H8.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h2.6c.1-.8.2-1.6.4-2.4H8.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h3.7c.2-1 .3-1.9.3-2 .1-.3.4-.4.7-.3.3.1.4.4.3.7-.1.3-.3 1.2-.5 2.1h4c.3 0 .5.2.5.5s-.2.5-.5.5h-4.4c-.2.8-.4 1.6-.5 2.4h2.4z"/>
  </svg>
);

// --- 开屏动画 ---
const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
    <div className="p-5 bg-white/20 backdrop-blur-md rounded-3xl mb-6 shadow-2xl animate-bounce-in">
      <Wallet size={64} className="text-white drop-shadow-md" />
    </div>
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold tracking-widest animate-slide-up" style={{ animationDelay: '0.2s' }}>王猪猪专属记账本</h1>
      <p className="text-emerald-100 text-sm font-light tracking-wide animate-slide-up" style={{ animationDelay: '0.4s' }}>每一笔都算数 🐷</p>
    </div>
    <div className="absolute bottom-20 w-48 h-1.5 bg-emerald-900/30 rounded-full overflow-hidden">
      <div className="h-full bg-emerald-200/80 rounded-full w-full animate-progress origin-left"></div>
    </div>
  </div>
);

// --- 🔐 简易登录组件 ---
const LoginScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [savedUser, setSavedUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('expense_user');
    if (user) {
      setSavedUser(JSON.parse(user));
      setIsRegistering(false);
    } else {
      setIsRegistering(true); // 没用户数据，去注册
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) { setError('请输入密码'); return; }

    if (isRegistering) {
      if (!name) { setError('请输入昵称'); return; }
      const newUser = { name, password };
      localStorage.setItem('expense_user', JSON.stringify(newUser));
      onLogin(newUser);
    } else {
      if (password === savedUser.password) {
        onLogin(savedUser);
      } else {
        setError('密码错误 🐷');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-gray-50 text-gray-800 px-6 animate-fade-in">
      <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
            {isRegistering ? <User size={32} /> : <Lock size={32} />}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          {isRegistering ? '创建账号' : `欢迎回来，${savedUser?.name || '王猪猪'}`}
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          {isRegistering ? '设置一个密码保护你的小金库' : '请输入密码解锁账本'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="text-xs font-bold text-gray-400 ml-1">昵称</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-gray-50 rounded-xl border focus:border-emerald-500 outline-none font-medium"
                placeholder="例如：王猪猪"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border focus:border-emerald-500 outline-none font-bold tracking-widest"
              placeholder="••••"
              inputMode="numeric" 
            />
          </div>
          
          {error && <p className="text-rose-500 text-center text-sm font-medium animate-pulse">{error}</p>}

          <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all">
            {isRegistering ? '开始记账' : '解锁'}
          </button>
        </form>
        
        {!isRegistering && (
          <div className="mt-6 text-center">
            <button onClick={() => { if(window.confirm('确定要重置账号吗？之前的记账数据会保留，但你需要重新设置密码。')) { localStorage.removeItem('expense_user'); setIsRegistering(true); setName(''); setPassword(''); } }} className="text-xs text-gray-400 hover:text-gray-600 underline">
              忘记密码 / 重置账号
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 🐷 超支预警 ---
const BudgetAlertModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-[280px] p-6 rounded-3xl shadow-2xl text-center animate-bounce-in border-4 border-rose-100">
        <div className="text-6xl mb-4 animate-bounce-slow">🐷</div>
        <h3 className="text-xl font-black text-gray-800 mb-2">王猪猪🐷</h3>
        <p className="text-rose-500 font-bold text-lg mb-6">没钱用啦！💸</p>
        <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-gray-300">我知道了 😭</button>
      </div>
    </div>
  );
};

// --- 💳 钱包查账弹窗 (修改版) ---
const WalletModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white w-[280px] p-6 rounded-3xl shadow-2xl text-center animate-scale-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-6">快捷查账助手</h3>
        <div className="space-y-4">
          {/* 微信 */}
          <a href="weixin://" className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-green-200 no-underline">
            <WeChatIcon /> <span>打开微信</span>
          </a>
          {/* 支付宝 */}
          <a href="alipays://platformapi/startapp?appId=20000055" className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#1677FF] hover:bg-[#1366db] text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-blue-200 no-underline">
            <AlipayIcon /> <span>打开支付宝</span>
          </a>
        </div>
        <button onClick={onClose} className="mt-6 text-sm text-gray-400 hover:text-gray-600 p-2">关闭</button>
      </div>
    </div>
  );
};

// --- 趋势图组件 ---
const TrendChart = ({ data, lineColor = "#10b981" }) => {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-gray-300 text-xs">暂无数据</div>;
  const height = 100; const width = 300;
  const maxVal = Math.max(...data.map(d => d.amount), 10); 
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.amount / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 -10 ${width} ${height + 20}`} className="w-full h-32 overflow-visible">
        <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth="1" />
        <line x1="0" y1={0} x2={width} y2={0} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
        <polyline fill="none" stroke={lineColor} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"/>
        {data.map((d, i) => d.amount > 0 && (
          <g key={i}>
            <circle cx={(i / (data.length - 1)) * width} cy={height - (d.amount / maxVal) * height} r="3" fill="white" stroke={lineColor} strokeWidth="2"/>
            {d.amount === maxVal && <text x={(i / (data.length - 1)) * width} y={height - (d.amount / maxVal) * height - 8} fontSize="10" fill={lineColor} textAnchor="middle" fontWeight="bold">¥{d.amount}</text>}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1"><span>1日</span><span>15日</span><span>{data.length}日</span></div>
    </div>
  );
};

// --- 动画组件 ---
const CountUp = ({ end, duration = 1000, prefix = '', decimals = 2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime; let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - percentage, 4);
      setCount(end * ease);
      if (progress < duration) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return <span>{prefix}{count.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
};

// --- 配置数据 (保持不变) ---
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
const formatCurrency = (amount) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday ? '今天' : `${date.getMonth() + 1}月${date.getDate()}日`;
};
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// --- AI 调用 ---
const callDomesticAI = async (base64Image) => {
  const prompt = `你是一个智能记账助手。请分析这张收据或账单截图。提取以下信息并严格以 JSON 格式返回：{ "type": "expense" (支出) 或 "income" (收入), "amount": 金额 (数字，不要符号), "category": "分类ID (从 food, transport, shopping, entertainment, housing, medical, other_expense, salary, bonus, investment, other_income 中选)", "date": "YYYY-MM-DD" (默认今年/今天), "note": "简短备注" }`;
  const payload = {
    model: AI_CONFIG.model,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }] }]
  };
  try {
    const response = await fetch(AI_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_CONFIG.apiKey}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API Error`);
    const data = await response.json();
    const cleanJson = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) { throw error; }
};

// --- 子组件 ---
const TransactionItem = ({ item, onDelete, index }) => {
  const isExpense = item.type === 'expense';
  const categoryList = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const category = categoryList.find(c => c.id === item.category) || categoryList[categoryList.length - 1];
  const Icon = category.icon;
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 transition-all hover:shadow-md active:scale-[0.99] animate-slide-in-up" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${category.color} transition-transform hover:rotate-12`}><Icon size={20} /></div>
        <div className="flex flex-col"><span className="font-medium text-gray-800">{category.name}</span><span className="text-xs text-gray-400">{formatDate(item.date)} {item.note && `· ${item.note}`}</span></div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold ${isExpense ? 'text-gray-900' : 'text-emerald-600'}`}>{isExpense ? '-' : '+'}{formatCurrency(item.amount).replace('CN¥', '')}</span>
        <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

const BudgetModal = ({ isOpen, onClose, currentBudget, onSave }) => {
  const [amount, setAmount] = useState(currentBudget);
  useEffect(() => { setAmount(currentBudget) }, [currentBudget, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity animate-fade-in">
      <div className="bg-white w-[300px] p-6 rounded-2xl shadow-2xl animate-scale-up">
        <h3 className="text-lg font-bold mb-4 text-gray-800">设置每月预算</h3>
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">¥</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-8 pr-3 py-3 bg-gray-50 rounded-xl text-2xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all" autoFocus placeholder="0" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-600 transition-colors">取消</button>
          <button onClick={() => { onSave(Number(amount)); onClose(); }} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all">保存</button>
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
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dailyTrans = transactions.filter(t => t.date === dateStr);
    const hasIncome = dailyTrans.some(t => t.type === 'income');
    const dailyExpense = dailyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    days.push(
      <div key={d} className="flex flex-col items-center justify-start h-12 py-1 relative cursor-pointer hover:bg-emerald-50 rounded-xl transition-colors group" onClick={() => onDateSelect && onDateSelect(dateStr)}>
        <span className={`text-xs font-medium transition-colors ${dailyTrans.length > 0 ? 'text-gray-900 group-hover:text-emerald-700' : 'text-gray-400'}`}>{d}</span>
        {dailyExpense > 0 && <span className="text-[8px] text-rose-500 font-bold -mt-0.5 scale-90 origin-top">-{Math.round(dailyExpense)}</span>}
        {hasIncome && !dailyExpense && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-sm"></div>}
      </div>
    );
  }
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4 animate-slide-in-up">
      <div className="grid grid-cols-7 gap-1 text-center mb-2">{['日', '一', '二', '三', '四', '五', '六'].map(day => <div key={day} className="text-xs text-gray-400 font-medium">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
};

const StatsView = ({ transactions, onExport, onImportTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState('all'); 

  const monthlyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
  });

  const filteredByType = monthlyTransactions.filter(t => t.type === viewType);
  const total = filteredByType.reduce((acc, curr) => acc + curr.amount, 0);
  const categoryTotals = filteredByType.reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const categoryList = viewType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const statsData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const catInfo = categoryList.find(c => c.id === catId) || { name: '其他', color: 'bg-gray-100', icon: MoreHorizontal };
    return { ...catInfo, amount, percentage: total === 0 ? 0 : (amount / total) * 100 };
  }).sort((a, b) => b.amount - a.amount);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const dailyTrendData = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dailyAmount = transactions.filter(t => t.date === dateStr && t.type === viewType && (selectedCategory === 'all' || t.category === selectedCategory)).reduce((sum, t) => sum + t.amount, 0);
      data.push({ day: d, amount: dailyAmount });
    }
    return data;
  }, [currentDate, viewType, selectedCategory, transactions]);

  return (
    <div className="pb-24 animate-fade-in px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 hover:scale-110 transition-all"><ChevronLeft size={20} /></button>
        <div className="text-lg font-bold text-gray-800 flex items-center gap-2 transition-all" key={currentDate.toString()}><CalendarIcon size={18} className="text-emerald-600"/>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</div>
        <button onClick={nextMonth} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 hover:scale-110 transition-all"><ChevronRight size={20} /></button>
      </div>
      
      <CalendarWidget currentDate={currentDate} transactions={monthlyTransactions} />
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 animate-slide-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><LineChart size={16} className="text-emerald-600"/>{viewType === 'expense' ? '支出' : '收入'}趋势</h3>
          <div className="flex gap-2 overflow-x-auto max-w-[180px] no-scrollbar pb-1">
            <button onClick={() => setSelectedCategory('all')} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>全部</button>
            {categoryList.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{cat.name}</button>))}
          </div>
        </div>
        <TrendChart data={dailyTrendData} lineColor={viewType === 'expense' ? '#f43f5e' : '#10b981'} />
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 animate-slide-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4 w-full">
          <button className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${viewType === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setViewType('expense')}>本月支出</button>
          <button className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${viewType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setViewType('income')}>本月收入</button>
        </div>
        <div className="text-center"><div className="text-3xl font-bold text-gray-900"><CountUp end={total} prefix="¥" /></div></div>
      </div>
      <div className="space-y-3 mb-8">
        {statsData.map((stat, idx) => (
          <div key={stat.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 animate-slide-in-up hover:shadow-md transition-shadow" style={{ animationDelay: `${0.2 + idx * 0.05}s`, animationFillMode: 'both' }}>
             <div className={`p-2 rounded-full ${stat.color} bg-opacity-20`}><stat.icon size={16} /></div>
             <div className="flex-1"><div className="flex justify-between text-sm mb-1"><span className="font-medium">{stat.name}</span><span className="font-bold">{formatCurrency(stat.amount)}</span></div>
               <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${viewType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: '0%', animation: `fillWidth 1s ease-out forwards`, '--target-width': `${stat.percentage}%` }}></div></div></div>
          </div>
        ))}
        {statsData.length === 0 && <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center animate-fade-in"><PieChart size={32} className="mb-2 opacity-20" />本月没有{viewType === 'expense' ? '支出' : '收入'}记录</div>}
      </div>
      <div className="border-t border-gray-200 pt-6 pb-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-1">数据管理</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onExport} className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-3 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all hover:border-emerald-200"><Download size={16} /><span className="text-xs font-medium">导出备份</span></button>
          <button onClick={onImportTrigger} className="flex items-center justify-center gap-2 bg-white border border-gray-200 p-3 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all hover:border-emerald-200"><Upload size={16} /><span className="text-xs font-medium">恢复数据</span></button>
        </div>
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
        if (type === 'expense' && !EXPENSE_CATEGORIES.find(c => c.id === category)) { setCategory(EXPENSE_CATEGORIES[0].id); } 
        else if (type === 'income' && !INCOME_CATEGORIES.find(c => c.id === category)) { setCategory(INCOME_CATEGORIES[0].id); }
    }
  }, [type, isOpen, category, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onAdd({ id: Date.now().toString(), type, amount: parseFloat(amount), category, date, note });
    onClose();
  };

  if (!isOpen) return null;
  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md transition-opacity animate-fade-in">
      <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">记一笔</h2>
            {initialData && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-medium animate-pulse"><Sparkles size={10} />AI已识别</span>}
          </div>
          <button onClick={onClose} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 hover:rotate-90 transition-all"><X size={20} className="text-gray-600" /></button>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`} onClick={() => setType('expense')}>支出</button>
          <button className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`} onClick={() => setType('income')}>收入</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium ml-1">金额</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">¥</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-2xl font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" autoFocus />
            </div>
          </div>
          <div>
             <label className="text-xs text-gray-400 font-medium ml-1">分类</label>
             <div className="grid grid-cols-4 gap-3 mt-2">
               {currentCategories.map((cat) => (
                 <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${category === cat.id ? 'bg-emerald-50 ring-2 ring-emerald-500 scale-105' : 'hover:bg-gray-50'}`}>
                   <div className={`p-2 rounded-full ${cat.color} bg-opacity-50`}><cat.icon size={18} /></div>
                   <span className="text-xs text-gray-600 truncate w-full text-center">{cat.name}</span>
                 </button>
               ))}
             </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1"><label className="text-xs text-gray-400 font-medium ml-1">日期</label><div className="relative mt-1"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"/></div></div>
            <div className="flex-[2]"><label className="text-xs text-gray-400 font-medium ml-1">备注 (选填)</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：晚餐 AA" className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"/></div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all mt-4">确认</button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  // 💰 钱包弹窗状态
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // 🔐 登录状态
  const [user, setUser] = useState(null); // 如果为 null 则显示登录界面

  const [transactions, setTransactions] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0); 
  const [loaded, setLoaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [budgetAlertDismissed, setBudgetAlertDismissed] = useState(false);

  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // 登录/注册成功回调
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('expense_tracker_data');
      if (savedData) setTransactions(JSON.parse(savedData));
      else {
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

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('expense_tracker_data', JSON.stringify(transactions));
      localStorage.setItem('expense_monthly_budget', monthlyBudget.toString());
    }
  }, [transactions, monthlyBudget, loaded]);

  const now = new Date();
  const currentMonthExpense = transactions.filter(t => {
     const d = new Date(t.date);
     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
  }).reduce((sum, t) => sum + t.amount, 0);
  
  const remainingBudget = monthlyBudget - currentMonthExpense;

  useEffect(() => {
    if (monthlyBudget > 0 && remainingBudget < 0 && !budgetAlertDismissed) {
      setShowBudgetAlert(true);
    }
    if (remainingBudget >= 0) {
      setBudgetAlertDismissed(false);
    }
  }, [remainingBudget, monthlyBudget, budgetAlertDismissed]);

  if (showSplash) return <SplashScreen />;

  // 🔐 如果没有登录，显示登录界面
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // --- 登录后的主界面逻辑 ---

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

  const currentMonthIncome = transactions.filter(t => {
     const d = new Date(t.date);
     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'income';
  }).reduce((sum, t) => sum + t.amount, 0);
  
  const budgetProgress = monthlyBudget > 0 ? Math.min((currentMonthExpense / monthlyBudget) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-100 animate-fade-in">
      
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
      <input type="file" accept=".json" ref={jsonInputRef} className="hidden" onChange={handleImport} />

      {isAnalyzing && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white p-6 rounded-2xl flex flex-col items-center animate-scale-up shadow-2xl">
             <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
             <p className="font-bold text-gray-800">AI 正在识别账单...</p>
           </div>
        </div>
      )}

      <BudgetAlertModal isOpen={showBudgetAlert} onClose={() => { setShowBudgetAlert(false); setBudgetAlertDismissed(true); }} />
      
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {activeTab === 'home' && (
        <div className="animate-fade-in">
          <div className="bg-emerald-600 text-white p-6 rounded-b-[2.5rem] shadow-lg shadow-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="relative z-10">
              {/* 顶部问候栏 (新增) */}
              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center gap-2 opacity-90">
                  <div className="bg-white/20 p-1.5 rounded-full"><User size={14} className="text-white" /></div>
                  <span className="text-sm font-medium">Hi, {user?.name}</span>
                </div>
                <button onClick={() => setUser(null)} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors">锁定</button>
              </div>

              <div className="flex justify-between items-start mb-4">
                 <div onClick={() => setShowBudgetModal(true)} className="cursor-pointer active:scale-95 transition-transform origin-left">
                   <div className="flex items-center gap-1 text-emerald-100 text-sm font-medium mb-1"><span>本月剩余预算</span><Settings size={14} className="opacity-70" /></div>
                   <div className="text-4xl font-bold tracking-tight"><span className="text-2xl opacity-80 mr-1">¥</span>{monthlyBudget > 0 ? <CountUp end={remainingBudget} /> : '--'}</div>
                 </div>
                 {/* 钱包图标：增加点击事件，触发 WalletModal */}
                 <div onClick={() => setShowWalletModal(true)} className="bg-white/20 p-2 rounded-lg backdrop-blur-md shadow-inner cursor-pointer hover:bg-white/30 transition-colors active:scale-95"><Wallet size={20} className="text-white" /></div>
              </div>
              {monthlyBudget > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-emerald-100 mb-1"><span>已用 {((currentMonthExpense/monthlyBudget)*100).toFixed(0)}%</span><span>预算 {monthlyBudget}</span></div>
                  <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ease-out ${remainingBudget < 0 ? 'bg-red-400' : 'bg-white'}`} style={{ width: `${budgetProgress}%` }}></div></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-colors"><div className="flex items-center gap-1 text-emerald-100 text-xs mb-1"><TrendingDown size={12} /><span>本月支出</span></div><div className="font-semibold text-lg"><CountUp end={currentMonthExpense} decimals={0} /></div></div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-colors"><div className="flex items-center gap-1 text-emerald-100 text-xs mb-1"><TrendingUp size={12} /><span>本月收入</span></div><div className="font-semibold text-lg"><CountUp end={currentMonthIncome} decimals={0} /></div></div>
              </div>
            </div>
          </div>
          <div className="px-4 mt-6">
            <div className="flex justify-between items-end mb-4 px-1"><h2 className="text-lg font-bold text-gray-800">近期账单</h2></div>
            <div className="pb-24">
              {transactions.length > 0 ? (
                transactions.slice(0, 10).map((item, index) => (<TransactionItem key={item.id} item={item} index={index} onDelete={handleDeleteTransaction} />))
              ) : (<div className="text-center py-10 opacity-50 animate-fade-in"><p>暂无记录</p></div>)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <StatsView transactions={transactions} onExport={handleExport} onImportTrigger={() => jsonInputRef.current?.click()} />
      )}

      <div className="fixed bottom-24 right-4 z-40 max-w-md w-full mx-auto pointer-events-none flex flex-col items-end gap-3 pr-8">
        <button onClick={() => fileInputRef.current?.click()} className="pointer-events-auto bg-emerald-100 text-emerald-700 p-3 rounded-full shadow-lg transition-transform active:scale-90 flex items-center justify-center hover:bg-emerald-200"><Camera size={24} /></button>
        <button onClick={() => { setAiData(null); setShowAddModal(true); }} className="pointer-events-auto bg-gray-900 text-white p-3 rounded-full shadow-lg transition-transform active:scale-90 flex items-center justify-center group hover:bg-black"><Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /></button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-30 max-w-md mx-auto">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}><Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} /><span className="text-[10px] font-medium">明细</span></button>
        <div className="w-12"></div> 
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-emerald-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}><PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} /><span className="text-[10px] font-medium">统计</span></button>
      </div>

      <AddTransactionModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTransaction} initialData={aiData} />
      <BudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} currentBudget={monthlyBudget} onSave={setMonthlyBudget} />
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-slide-in-up { animation: slideInUp 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; opacity: 0; transform: translateY(20px); }
        
        .animate-bounce-in { animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-bounce-slow { animation: bounce 2s infinite; }
        .animate-progress { animation: progress 1.8s ease-out forwards; width: 0%; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes fillWidth { to { width: var(--target-width); } }
        
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
