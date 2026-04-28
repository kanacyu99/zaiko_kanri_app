import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  MinusCircle, 
  List, 
  History, 
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';

// Sample Data
const initialItems = [
  { id: '1', name: '軍手', category: '消耗品', unit: '双', location: '試験室棚A', minStock: 10, targetStock: 30, supplier: '○○商事', note: '', currentStock: 30 },
  { id: '2', name: '試験用ポリ袋', category: '消耗品', unit: '袋', location: '試験室棚B', minStock: 5, targetStock: 20, supplier: '△△商店', note: '', currentStock: 20 },
  { id: '3', name: 'pH試験紙', category: '試験用品', unit: '箱', location: '試験室棚C', minStock: 2, targetStock: 10, supplier: '□□科学', note: '', currentStock: 10 },
  { id: '4', name: 'ヘルメット', category: '備品', unit: '個', location: '倉庫1', minStock: 3, targetStock: 10, supplier: '安全用品店', note: '', currentStock: 10 },
  { id: '5', name: 'コピー用紙', category: '事務用品', unit: '箱', location: '事務所', minStock: 2, targetStock: 8, supplier: '文具店', note: '', currentStock: 8 },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('zaiko_items');
    return saved ? JSON.parse(saved) : initialItems;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('zaiko_history');
    return saved ? JSON.parse(saved) : [];
  });

  // LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem('zaiko_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('zaiko_history', JSON.stringify(history));
  }, [history]);

  // Helper to get status
  const getStatus = (item) => {
    if (item.currentStock < item.minStock) return { label: '要発注', color: 'status-red' };
    if (item.currentStock < item.targetStock) return { label: '少なめ', color: 'status-yellow' };
    return { label: '十分', color: 'status-green' };
  };

  // Reset Data
  const resetData = () => {
    if (window.confirm('全てのデータを初期化しますか？（物品マスタ、入出庫履歴がすべて消去されます）')) {
      setItems(initialItems);
      setHistory([]);
      alert('初期化しました。');
    }
  };

  // Tabs
  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: '現在庫一覧', icon: <Package size={20} /> },
    { id: 'inbound', label: '入庫登録', icon: <PlusCircle size={20} /> },
    { id: 'outbound', label: '出庫登録', icon: <MinusCircle size={20} /> },
    { id: 'master', label: '物品マスタ', icon: <List size={20} /> },
    { id: 'history', label: '入出庫履歴', icon: <History size={20} /> },
    { id: 'shortage', label: '在庫不足', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>在庫管理システム</h1>
        <button className="reset-btn" onClick={resetData} title="データを初期化">
          <RefreshCw size={16} /> 初期化
        </button>
      </header>

      <nav className="tab-navigation">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && <Dashboard items={items} history={history} setActiveTab={setActiveTab} getStatus={getStatus} />}
        {activeTab === 'inventory' && <Inventory items={items} getStatus={getStatus} />}
        {activeTab === 'inbound' && <Inbound items={items} setItems={setItems} setHistory={setHistory} />}
        {activeTab === 'outbound' && <Outbound items={items} setItems={setItems} setHistory={setHistory} />}
        {activeTab === 'master' && <Master items={items} setItems={setItems} />}
        {activeTab === 'history' && <HistoryLog history={history} />}
        {activeTab === 'shortage' && <ShortageList items={items} />}
      </main>

      <footer className="app-footer">
        &copy; 2024 在庫管理システム
      </footer>
    </div>
  );
}

// --- Components for each Tab ---

const Dashboard = ({ items, history, setActiveTab, getStatus }) => {
  const lowStockItems = items.filter(item => item.currentStock < item.minStock);
  const today = new Date().toISOString().split('T')[0];
  const todayInbound = history.filter(h => h.type === '入庫' && h.date === today).length;
  const todayOutbound = history.filter(h => h.type === '出庫' && h.date === today).length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">登録物品数</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('shortage')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">在庫不足件数</div>
          <div className="stat-value text-red">{lowStockItems.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本日の入庫</div>
          <div className="stat-value">{todayInbound}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本日の出庫</div>
          <div className="stat-value">{todayOutbound}</div>
        </div>
      </div>

      <div className="section-card">
        <h3>要発注リスト</h3>
        {lowStockItems.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>品名</th>
                  <th>現在庫</th>
                  <th>最低在庫</th>
                  <th>不足数</th>
                  <th>発注先</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="text-red">{item.currentStock} {item.unit}</td>
                    <td>{item.minStock} {item.unit}</td>
                    <td>{item.targetStock - item.currentStock} {item.unit}</td>
                    <td>{item.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-message">現在、在庫不足の物品はありません。</p>
        )}
      </div>
    </div>
  );
};

const Inventory = ({ items, getStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const categories = [...new Set(items.map(i => i.category))];
  const locations = [...new Set(items.map(i => i.location))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || item.category === filterCategory;
    const matchesLocation = filterLocation === '' || item.location === filterLocation;
    const matchesLowStock = !showLowStockOnly || item.currentStock < item.minStock;
    return matchesSearch && matchesCategory && matchesLocation && matchesLowStock;
  });

  return (
    <div className="inventory">
      <div className="filter-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="品名で検索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">全ての分類</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
            <option value="">全ての保管場所</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            要発注のみ
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>品名</th>
                <th>分類</th>
                <th>現在庫数</th>
                <th>単位</th>
                <th>最低 / 標準</th>
                <th>保管場所</th>
                <th>発注先</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const status = getStatus(item);
                return (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td>
                    <td>{item.category}</td>
                    <td className="font-bold">{item.currentStock}</td>
                    <td>{item.unit}</td>
                    <td>{item.minStock} / {item.targetStock}</td>
                    <td>{item.location}</td>
                    <td>{item.supplier}</td>
                    <td>
                      <span className={`status-badge ${status.color}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Inbound = ({ items, setItems, setHistory }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemId: '',
    quantity: '',
    supplier: '',
    lotNumber: '',
    location: '',
    user: '',
    note: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.quantity) {
      alert('品名と数量は必須です。');
      return;
    }

    const item = items.find(i => i.id === formData.itemId);
    const quantity = Number(formData.quantity);

    // Update Item Stock
    const updatedItems = items.map(i => {
      if (i.id === formData.itemId) {
        return { ...i, currentStock: i.currentStock + quantity };
      }
      return i;
    });
    setItems(updatedItems);

    // Add History
    const newHistory = {
      id: Date.now(),
      type: '入庫',
      date: formData.date,
      itemName: item.name,
      quantity: quantity,
      user: formData.user || '未入力',
      location: formData.location || item.location,
      note: formData.note,
      details: {
        supplier: formData.supplier,
        lotNumber: formData.lotNumber
      }
    };
    setHistory(prev => [newHistory, ...prev]);

    alert('入庫登録を完了しました。');
    setFormData({
      ...formData,
      itemId: '',
      quantity: '',
      lotNumber: '',
      note: ''
    });
  };

  return (
    <div className="form-container">
      <div className="section-card">
        <h2>入庫登録</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label>入庫日</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>品名</label>
            <select value={formData.itemId} onChange={e => {
              const selectedItem = items.find(i => i.id === e.target.value);
              setFormData({...formData, itemId: e.target.value, supplier: selectedItem?.supplier || ''});
            }} required>
              <option value="">選択してください</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>数量</label>
            <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>納入業者</label>
            <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          </div>
          <div className="form-group">
            <label>ロット番号</label>
            <input type="text" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} />
          </div>
          <div className="form-group">
            <label>保管場所</label>
            <input type="text" placeholder="空欄時はマスタ設定を使用" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="form-group">
            <label>登録者</label>
            <input type="text" value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} />
          </div>
          <div className="form-group full-width">
            <label>備考</label>
            <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}></textarea>
          </div>
          <div className="form-actions full-width">
            <button type="submit" className="submit-btn"><PlusCircle size={20} /> 入庫登録する</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Outbound = ({ items, setItems, setHistory }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemId: '',
    quantity: '',
    user: '',
    department: '',
    purpose: '',
    location: '',
    note: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.quantity) {
      alert('品名と数量は必須です。');
      return;
    }

    const item = items.find(i => i.id === formData.itemId);
    const quantity = Number(formData.quantity);

    if (item.currentStock < quantity) {
      alert(`在庫不足です。現在の在庫: ${item.currentStock} ${item.unit}`);
      return;
    }

    // Update Item Stock
    const updatedItems = items.map(i => {
      if (i.id === formData.itemId) {
        return { ...i, currentStock: i.currentStock - quantity };
      }
      return i;
    });
    setItems(updatedItems);

    // Add History
    const newHistory = {
      id: Date.now(),
      type: '出庫',
      date: formData.date,
      itemName: item.name,
      quantity: quantity,
      user: formData.user || '未入力',
      location: formData.location || item.location,
      note: formData.note,
      details: {
        department: formData.department,
        purpose: formData.purpose
      }
    };
    setHistory(prev => [newHistory, ...prev]);

    alert('出庫登録を完了しました。');
    setFormData({
      ...formData,
      itemId: '',
      quantity: '',
      note: ''
    });
  };

  return (
    <div className="form-container">
      <div className="section-card">
        <h2>出庫登録</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-group">
            <label>出庫日</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>品名</label>
            <select value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})} required>
              <option value="">選択してください</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (現在庫: {item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>数量</label>
            <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>使用者</label>
            <input type="text" value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} />
          </div>
          <div className="form-group">
            <label>使用部署</label>
            <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
          </div>
          <div className="form-group">
            <label>使用目的</label>
            <input type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
          </div>
          <div className="form-group">
            <label>保管場所</label>
            <input type="text" placeholder="空欄時はマスタ設定を使用" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="form-group full-width">
            <label>備考</label>
            <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}></textarea>
          </div>
          <div className="form-actions full-width">
            <button type="submit" className="submit-btn outbound-btn"><MinusCircle size={20} /> 出庫登録する</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Master = ({ items, setItems }) => {
  const [isEditing, setIsEditing] = useState(null); // id of item being edited or 'new'
  const [formData, setFormData] = useState({
    name: '', category: '', unit: '', location: '', minStock: '', targetStock: '', supplier: '', note: ''
  });

  const handleEdit = (item) => {
    setIsEditing(item.id);
    setFormData({ ...item });
  };

  const handleAddNew = () => {
    setIsEditing('new');
    setFormData({
      name: '', category: '', unit: '', location: '', minStock: 0, targetStock: 0, supplier: '', note: ''
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('この物品を削除しますか？在庫データも失われます。')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing === 'new') {
      const newItem = {
        ...formData,
        id: Date.now().toString(),
        currentStock: 0,
        minStock: Number(formData.minStock),
        targetStock: Number(formData.targetStock)
      };
      setItems([...items, newItem]);
    } else {
      setItems(items.map(i => i.id === isEditing ? { 
        ...i, 
        ...formData,
        minStock: Number(formData.minStock),
        targetStock: Number(formData.targetStock)
      } : i));
    }
    setIsEditing(null);
  };

  return (
    <div className="master-data">
      <div className="action-bar">
        <h2>物品マスタ登録</h2>
        <button className="add-btn" onClick={handleAddNew}><Plus size={20} /> 新規登録</button>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing === 'new' ? '物品の新規登録' : '物品の編集'}</h3>
            <form onSubmit={handleSubmit} className="entry-form">
              <div className="form-group">
                <label>品名</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>分類</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>単位</label>
                <input type="text" placeholder="個、袋、箱など" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>保管場所</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label>最低在庫数</label>
                <input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>標準在庫数</label>
                <input type="number" min="0" value={formData.targetStock} onChange={e => setFormData({...formData, targetStock: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>発注先</label>
                <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
              </div>
              <div className="form-group full-width">
                <label>備考</label>
                <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}></textarea>
              </div>
              <div className="form-actions full-width">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(null)}>キャンセル</button>
                <button type="submit" className="submit-btn"><Save size={20} /> 保存する</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="section-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>品名</th>
                <th>分類</th>
                <th>単位</th>
                <th>保管場所</th>
                <th>最低 / 標準</th>
                <th>発注先</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="font-bold">{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>{item.location}</td>
                  <td>{item.minStock} / {item.targetStock}</td>
                  <td>{item.supplier}</td>
                  <td className="actions-cell">
                    <button className="icon-btn edit" onClick={() => handleEdit(item)}><Edit size={16} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const HistoryLog = ({ history }) => {
  return (
    <div className="history">
      <div className="section-card">
        <h2>入出庫履歴</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>区分</th>
                <th>品名</th>
                <th>数量</th>
                <th>登録者/使用者</th>
                <th>保管場所</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map(log => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>
                    <span className={`status-badge ${log.type === '入庫' ? 'status-green' : 'status-red'}`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="font-bold">{log.itemName}</td>
                  <td>{log.quantity}</td>
                  <td>{log.user}</td>
                  <td>{log.location}</td>
                  <td>{log.note}</td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="empty-message">履歴はありません。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ShortageList = ({ items }) => {
  const lowStockItems = items.filter(item => item.currentStock < item.minStock);

  return (
    <div className="shortage">
      <div className="section-card">
        <h2>在庫不足リスト</h2>
        <p className="description">最低在庫数を下回っている物品を表示しています。</p>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>品名</th>
                <th>現在庫数</th>
                <th>最低在庫数</th>
                <th>不足数</th>
                <th>発注先</th>
                <th>保管場所</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? lowStockItems.map(item => (
                <tr key={item.id}>
                  <td className="font-bold">{item.name}</td>
                  <td className="text-red font-bold">{item.currentStock} {item.unit}</td>
                  <td>{item.minStock} {item.unit}</td>
                  <td className="font-bold">{item.targetStock - item.currentStock} {item.unit}</td>
                  <td>{item.supplier}</td>
                  <td>{item.location}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty-message">在庫不足の物品はありません。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
