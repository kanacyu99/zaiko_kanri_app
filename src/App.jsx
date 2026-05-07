import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  MinusCircle,
  List,
  History,
  AlertTriangle,
  Search,
  Trash2,
  Edit,
  Save,
  Plus,
  RefreshCw,
  Download,
  ClipboardCheck,
  Database,
  Upload,
} from "lucide-react";

const initialItems = [
  {
    id: "1",
    name: "軍手",
    category: "消耗品",
    unit: "双",
    location: "試験室棚A",
    minStock: 10,
    targetStock: 30,
    supplier: "○○商事",
    note: "",
    currentStock: 30,
  },
  {
    id: "2",
    name: "試験用ポリ袋",
    category: "消耗品",
    unit: "袋",
    location: "試験室棚B",
    minStock: 5,
    targetStock: 20,
    supplier: "△△商店",
    note: "",
    currentStock: 20,
  },
  {
    id: "3",
    name: "pH試験紙",
    category: "試験用品",
    unit: "箱",
    location: "試験室棚C",
    minStock: 2,
    targetStock: 10,
    supplier: "□□科学",
    note: "",
    currentStock: 10,
  },
  {
    id: "4",
    name: "ヘルメット",
    category: "備品",
    unit: "個",
    location: "倉庫1",
    minStock: 3,
    targetStock: 10,
    supplier: "安全用品店",
    note: "",
    currentStock: 10,
  },
  {
    id: "5",
    name: "コピー用紙",
    category: "事務用品",
    unit: "箱",
    location: "事務所",
    minStock: 2,
    targetStock: 8,
    supplier: "文具店",
    note: "",
    currentStock: 8,
  },
];

const getToday = () => new Date().toISOString().split("T")[0];

const getDateForFileName = () => getToday().replace(/-/g, "");

const getDateTimeForFileName = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadCSV = (filename, headers, rows) => {
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, filename);
  alert("CSVを出力しました。");
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const parseCSVText = (text) => {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      currentRow.push(currentValue);

      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  currentRow.push(currentValue);

  if (currentRow.some((value) => value.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
};

const normalizeHeader = (value) => String(value || "").trim();

const toNumberOrZero = (value) => {
  const number = Number(String(value || "").replace(/,/g, "").trim());
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const buffer = reader.result;
        let text = new TextDecoder("utf-8").decode(buffer);

        if (text.includes("�")) {
          text = new TextDecoder("shift_jis").decode(buffer);
        }

        resolve(text.replace(/^\uFEFF/, ""));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("zaiko_items");
    return saved ? JSON.parse(saved) : initialItems;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("zaiko_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [stocktakingLogs, setStocktakingLogs] = useState(() => {
    const saved = localStorage.getItem("inventory_stocktaking_logs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("zaiko_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("zaiko_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      "inventory_stocktaking_logs",
      JSON.stringify(stocktakingLogs)
    );
  }, [stocktakingLogs]);

  const getStatus = (item) => {
    if (Number(item.currentStock) < Number(item.minStock)) {
      return { label: "要発注", color: "status-red" };
    }
    if (Number(item.currentStock) < Number(item.targetStock)) {
      return { label: "少なめ", color: "status-yellow" };
    }
    return { label: "十分", color: "status-green" };
  };

  const resetData = () => {
    if (
      window.confirm(
        "全てのデータを初期化しますか？\n物品マスタ、入出庫履歴、棚卸し履歴がすべて消去されます。"
      )
    ) {
      setItems(initialItems);
      setHistory([]);
      setStocktakingLogs([]);
      alert("初期化しました。");
    }
  };

  const tabs = [
    { id: "dashboard", label: "ダッシュボード", icon: <LayoutDashboard size={20} /> },
    { id: "inventory", label: "現在庫一覧", icon: <Package size={20} /> },
    { id: "inbound", label: "入庫登録", icon: <PlusCircle size={20} /> },
    { id: "outbound", label: "出庫登録", icon: <MinusCircle size={20} /> },
    { id: "master", label: "物品マスタ", icon: <List size={20} /> },
    { id: "history", label: "入出庫履歴", icon: <History size={20} /> },
    { id: "shortage", label: "在庫不足", icon: <AlertTriangle size={20} /> },
    { id: "stocktaking", label: "棚卸し", icon: <ClipboardCheck size={20} /> },
    { id: "backup", label: "バックアップ", icon: <Database size={20} /> },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>在庫管理システム</h1>
        <button className="reset-btn" onClick={resetData}>
          <RefreshCw size={16} />
          初期化
        </button>
      </header>

      <nav className="tab-navigation">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="content">
        {activeTab === "dashboard" && (
          <Dashboard
            items={items}
            history={history}
            stocktakingLogs={stocktakingLogs}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "inventory" && (
          <Inventory items={items} getStatus={getStatus} />
        )}

        {activeTab === "inbound" && (
          <Inbound items={items} setItems={setItems} setHistory={setHistory} />
        )}

        {activeTab === "outbound" && (
          <Outbound items={items} setItems={setItems} setHistory={setHistory} />
        )}

        {activeTab === "master" && (
          <Master items={items} setItems={setItems} />
        )}

        {activeTab === "history" && <HistoryLog history={history} setHistory={setHistory} />}

        {activeTab === "shortage" && <ShortageList items={items} />}

        {activeTab === "stocktaking" && (
          <Stocktaking
            items={items}
            setItems={setItems}
            setHistory={setHistory}
            stocktakingLogs={stocktakingLogs}
            setStocktakingLogs={setStocktakingLogs}
          />
        )}

        {activeTab === "backup" && (
          <Backup
            items={items}
            history={history}
            stocktakingLogs={stocktakingLogs}
            setItems={setItems}
            setHistory={setHistory}
            setStocktakingLogs={setStocktakingLogs}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      <footer className="app-footer">© 2024 在庫管理システム</footer>
    </div>
  );
}

function Dashboard({ items, history, stocktakingLogs, setActiveTab }) {
  const lowStockItems = items.filter(
    (item) => Number(item.currentStock) < Number(item.minStock)
  );

  const today = getToday();

  const todayInbound = history.filter(
    (log) => log.type === "入庫" && log.date === today
  ).length;

  const todayOutbound = history.filter(
    (log) => log.type === "出庫" && log.date === today
  ).length;

  const latestStocktakingDate =
    stocktakingLogs.length > 0 ? stocktakingLogs[0].date : "未実施";

  const diffCount = stocktakingLogs.filter(
    (log) => Number(log.diff) !== 0
  ).length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">登録物品数</div>
          <div className="stat-value">{items.length}</div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("shortage")}
          style={{ cursor: "pointer" }}
        >
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

        <div
          className="stat-card"
          onClick={() => setActiveTab("stocktaking")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-label">最新の棚卸し日</div>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>
            {latestStocktakingDate}
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("stocktaking")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-label">棚卸し差異あり件数</div>
          <div className={`stat-value ${diffCount > 0 ? "text-red" : ""}`}>
            {diffCount}
          </div>
        </div>
      </div>

      <div className="dashboard-flex">
        <div className="section-card flex-1">
          <div className="action-bar">
            <h3>要発注リスト</h3>
            <button
              className="text-link-btn"
              onClick={() => setActiveTab("shortage")}
            >
              詳細を見る
            </button>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>品名</th>
                    <th>現在庫</th>
                    <th>不足数</th>
                    <th>発注先</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td className="font-bold">{item.name}</td>
                      <td className="text-red">
                        {item.currentStock} {item.unit}
                      </td>
                      <td>
                        {Number(item.targetStock) - Number(item.currentStock)}{" "}
                        {item.unit}
                      </td>
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

        <div className="section-card flex-1">
          <div className="action-bar">
            <h3>棚卸し履歴</h3>
            <button
              className="text-link-btn"
              onClick={() => setActiveTab("stocktaking")}
            >
              詳細を見る
            </button>
          </div>

          {stocktakingLogs.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>品名</th>
                    <th>差異</th>
                  </tr>
                </thead>
                <tbody>
                  {stocktakingLogs.slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td className="font-bold">{log.itemName}</td>
                      <td>{log.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-message">棚卸し履歴はありません。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Inventory({ items, getStatus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const categories = [...new Set(items.map((item) => item.category))];
  const locations = [...new Set(items.map((item) => item.location))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "" || item.category === filterCategory;
    const matchesLocation =
      filterLocation === "" || item.location === filterLocation;
    const matchesLowStock =
      !showLowStockOnly ||
      Number(item.currentStock) < Number(item.minStock);

    return (
      matchesSearch && matchesCategory && matchesLocation && matchesLowStock
    );
  });

  const handleExport = () => {
    const headers = [
      "品名",
      "分類",
      "現在庫数",
      "単位",
      "最低在庫数",
      "標準在庫数",
      "保管場所",
      "発注先",
      "状態",
      "備考",
    ];

    const rows = filteredItems.map((item) => {
      const status = getStatus(item);
      return [
        item.name,
        item.category,
        item.currentStock,
        item.unit,
        item.minStock,
        item.targetStock,
        item.location,
        item.supplier,
        status.label,
        item.note,
      ];
    });

    downloadCSV(`inventory_current_${getDateForFileName()}.csv`, headers, rows);
  };

  return (
    <div className="inventory">
      <div className="action-bar">
        <h2>現在庫一覧</h2>
        <button className="export-btn" onClick={handleExport}>
          <Download size={20} />
          現在庫CSV出力
        </button>
      </div>

      <div className="filter-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="品名で検索..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
          >
            <option value="">全ての分類</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filterLocation}
            onChange={(event) => setFilterLocation(event.target.value)}
          >
            <option value="">全ての保管場所</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(event) => setShowLowStockOnly(event.target.checked)}
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
              {filteredItems.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td>
                    <td>{item.category}</td>
                    <td className="font-bold">{item.currentStock}</td>
                    <td>{item.unit}</td>
                    <td>
                      {item.minStock} / {item.targetStock}
                    </td>
                    <td>{item.location}</td>
                    <td>{item.supplier}</td>
                    <td>
                      <span className={`status-badge ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-message">
                    該当する物品はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Inbound({ items, setItems, setHistory }) {
  const [formData, setFormData] = useState({
    date: getToday(),
    itemId: "",
    quantity: "",
    supplier: "",
    lotNumber: "",
    location: "",
    user: "",
    note: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.itemId || !formData.quantity) {
      alert("品名と数量は必須です。");
      return;
    }

    const item = items.find((target) => target.id === formData.itemId);
    const quantity = Number(formData.quantity);

    if (!item || quantity <= 0) {
      alert("入力内容を確認してください。");
      return;
    }

    setItems((prevItems) =>
      prevItems.map((target) =>
        target.id === formData.itemId
          ? { ...target, currentStock: Number(target.currentStock) + quantity }
          : target
      )
    );

    const newHistory = {
      id: Date.now(),
      type: "入庫",
      date: formData.date,
      itemName: item.name,
      quantity,
      user: formData.user || "未入力",
      location: formData.location || item.location,
      note: formData.note,
      details: {
        supplier: formData.supplier,
        lotNumber: formData.lotNumber,
      },
    };

    setHistory((prev) => [newHistory, ...prev]);

    alert("入庫登録を完了しました。");

    setFormData({
      ...formData,
      itemId: "",
      quantity: "",
      lotNumber: "",
      note: "",
    });
  };

  return (
    <div className="form-container">
      <div className="section-card">
        <h2>入庫登録</h2>

        <form onSubmit={handleSubmit} className="entry-form">
          <FormGroup label="入庫日">
            <input
              type="date"
              value={formData.date}
              onChange={(event) =>
                setFormData({ ...formData, date: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="品名">
            <select
              value={formData.itemId}
              onChange={(event) => {
                const selectedItem = items.find(
                  (item) => item.id === event.target.value
                );
                setFormData({
                  ...formData,
                  itemId: event.target.value,
                  supplier: selectedItem?.supplier || "",
                  location: selectedItem?.location || "",
                });
              }}
              required
            >
              <option value="">選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="数量">
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(event) =>
                setFormData({ ...formData, quantity: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="納入業者">
            <input
              type="text"
              value={formData.supplier}
              onChange={(event) =>
                setFormData({ ...formData, supplier: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="ロット番号">
            <input
              type="text"
              value={formData.lotNumber}
              onChange={(event) =>
                setFormData({ ...formData, lotNumber: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="保管場所">
            <input
              type="text"
              value={formData.location}
              onChange={(event) =>
                setFormData({ ...formData, location: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="登録者">
            <input
              type="text"
              value={formData.user}
              onChange={(event) =>
                setFormData({ ...formData, user: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="備考" fullWidth>
            <textarea
              value={formData.note}
              onChange={(event) =>
                setFormData({ ...formData, note: event.target.value })
              }
            />
          </FormGroup>

          <div className="form-actions full-width">
            <button type="submit" className="submit-btn">
              <PlusCircle size={20} />
              入庫登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Outbound({ items, setItems, setHistory }) {
  const [formData, setFormData] = useState({
    date: getToday(),
    itemId: "",
    quantity: "",
    user: "",
    department: "",
    purpose: "",
    location: "",
    note: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.itemId || !formData.quantity) {
      alert("品名と数量は必須です。");
      return;
    }

    const item = items.find((target) => target.id === formData.itemId);
    const quantity = Number(formData.quantity);

    if (!item || quantity <= 0) {
      alert("入力内容を確認してください。");
      return;
    }

    if (Number(item.currentStock) < quantity) {
      alert(`在庫不足です。現在の在庫：${item.currentStock} ${item.unit}`);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((target) =>
        target.id === formData.itemId
          ? { ...target, currentStock: Number(target.currentStock) - quantity }
          : target
      )
    );

    const newHistory = {
      id: Date.now(),
      type: "出庫",
      date: formData.date,
      itemName: item.name,
      quantity,
      user: formData.user || "未入力",
      location: formData.location || item.location,
      note: formData.note,
      details: {
        department: formData.department,
        purpose: formData.purpose,
      },
    };

    setHistory((prev) => [newHistory, ...prev]);

    alert("出庫登録を完了しました。");

    setFormData({
      ...formData,
      itemId: "",
      quantity: "",
      note: "",
    });
  };

  return (
    <div className="form-container">
      <div className="section-card">
        <h2>出庫登録</h2>

        <form onSubmit={handleSubmit} className="entry-form">
          <FormGroup label="出庫日">
            <input
              type="date"
              value={formData.date}
              onChange={(event) =>
                setFormData({ ...formData, date: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="品名">
            <select
              value={formData.itemId}
              onChange={(event) => {
                const selectedItem = items.find(
                  (item) => item.id === event.target.value
                );
                setFormData({
                  ...formData,
                  itemId: event.target.value,
                  location: selectedItem?.location || "",
                });
              }}
              required
            >
              <option value="">選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}（現在庫：{item.currentStock} {item.unit}）
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="数量">
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(event) =>
                setFormData({ ...formData, quantity: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="使用者">
            <input
              type="text"
              value={formData.user}
              onChange={(event) =>
                setFormData({ ...formData, user: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="使用部署">
            <input
              type="text"
              value={formData.department}
              onChange={(event) =>
                setFormData({ ...formData, department: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="使用目的">
            <input
              type="text"
              value={formData.purpose}
              onChange={(event) =>
                setFormData({ ...formData, purpose: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="保管場所">
            <input
              type="text"
              value={formData.location}
              onChange={(event) =>
                setFormData({ ...formData, location: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="備考" fullWidth>
            <textarea
              value={formData.note}
              onChange={(event) =>
                setFormData({ ...formData, note: event.target.value })
              }
            />
          </FormGroup>

          <div className="form-actions full-width">
            <button type="submit" className="submit-btn outbound-btn">
              <MinusCircle size={20} />
              出庫登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Master({ items, setItems }) {
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "",
    location: "",
    minStock: "",
    targetStock: "",
    supplier: "",
    note: "",
  });

  const handleAddNew = () => {
    setIsEditing("new");
    setFormData({
      name: "",
      category: "",
      unit: "",
      location: "",
      minStock: 0,
      targetStock: 0,
      supplier: "",
      note: "",
    });
  };

  const handleEdit = (item) => {
    setIsEditing(item.id);
    setFormData({ ...item });
  };

  const handleDelete = (id) => {
    if (window.confirm("この物品を削除しますか？")) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name || !formData.unit) {
      alert("品名と単位は必須です。");
      return;
    }

    if (isEditing === "new") {
      const newItem = {
        ...formData,
        id: Date.now().toString(),
        currentStock: Number(formData.currentStock || 0),
        minStock: Number(formData.minStock),
        targetStock: Number(formData.targetStock),
      };
      setItems([...items, newItem]);
    } else {
      setItems(
        items.map((item) =>
          item.id === isEditing
            ? {
                ...item,
                ...formData,
                currentStock: Number(
                  formData.currentStock || item.currentStock || 0
                ),
                minStock: Number(formData.minStock),
                targetStock: Number(formData.targetStock),
              }
            : item
        )
      );
    }

    setIsEditing(null);
  };

  const handleExport = () => {
    const headers = [
      "品名",
      "分類",
      "単位",
      "保管場所",
      "最低在庫数",
      "標準在庫数",
      "発注先",
      "備考",
      "現在庫数",
    ];

    const rows = items.map((item) => [
      item.name,
      item.category,
      item.unit,
      item.location,
      item.minStock,
      item.targetStock,
      item.supplier,
      item.note,
      item.currentStock,
    ]);

    downloadCSV(`inventory_master_${getDateForFileName()}.csv`, headers, rows);
  };

  const handleTemplateExport = () => {
    const headers = [
      "品名",
      "分類",
      "単位",
      "保管場所",
      "最低在庫数",
      "標準在庫数",
      "発注先",
      "備考",
      "現在庫数",
    ];

    downloadCSV(
      `inventory_master_template_${getDateForFileName()}.csv`,
      headers,
      []
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const rows = parseCSVText(text);

      if (rows.length < 2) {
        alert("CSVに読込対象のデータがありません。");
        event.target.value = "";
        return;
      }

      const headers = rows[0].map(normalizeHeader);

      const requiredHeaders = [
        "品名",
        "分類",
        "単位",
        "保管場所",
        "最低在庫数",
        "標準在庫数",
        "発注先",
        "備考",
        "現在庫数",
      ];

      const hasAllHeaders = requiredHeaders.every((header) =>
        headers.includes(header)
      );

      if (!hasAllHeaders) {
        alert(
          "CSVの形式が正しくありません。\nテンプレートCSVを出力し、その形式に合わせてください。"
        );
        event.target.value = "";
        return;
      }

      const getValue = (row, headerName) => {
        const index = headers.indexOf(headerName);
        return index >= 0 ? String(row[index] || "").trim() : "";
      };

      const importedItems = rows
        .slice(1)
        .map((row, index) => {
          const name = getValue(row, "品名");
          const unit = getValue(row, "単位");

          if (!name || !unit) {
            return null;
          }

          return {
            id: `import-${Date.now()}-${index}`,
            name,
            category: getValue(row, "分類"),
            unit,
            location: getValue(row, "保管場所"),
            minStock: toNumberOrZero(getValue(row, "最低在庫数")),
            targetStock: toNumberOrZero(getValue(row, "標準在庫数")),
            supplier: getValue(row, "発注先"),
            note: getValue(row, "備考"),
            currentStock: toNumberOrZero(getValue(row, "現在庫数")),
          };
        })
        .filter(Boolean);

      if (importedItems.length === 0) {
        alert("読込できる物品データがありません。品名と単位を確認してください。");
        event.target.value = "";
        return;
      }

      const confirmed = window.confirm(
        `${importedItems.length}件の物品マスタを読み込みます。\n同じ品名がある場合はCSVの内容で上書きし、新しい品名は追加します。\nよろしいですか？`
      );

      if (!confirmed) {
        event.target.value = "";
        return;
      }

      setItems((prevItems) => {
        const updatedItems = [...prevItems];

        importedItems.forEach((importedItem) => {
          const existingIndex = updatedItems.findIndex(
            (item) => item.name === importedItem.name
          );

          if (existingIndex >= 0) {
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              ...importedItem,
              id: updatedItems[existingIndex].id,
            };
          } else {
            updatedItems.push(importedItem);
          }
        });

        return updatedItems;
      });

      alert("物品マスタCSVを読み込みました。");
      event.target.value = "";
    } catch (error) {
      alert("CSVファイルを読み込めませんでした。");
      event.target.value = "";
    }
  };

  return (
    <div className="master-data">
      <div className="action-bar">
        <h2>物品マスタ登録</h2>

        <div className="master-actions">
          <button className="template-btn" onClick={handleTemplateExport}>
            <Download size={20} />
            テンプレートCSV出力
          </button>

          <button className="import-btn" onClick={handleImportClick}>
            <Upload size={20} />
            物品マスタCSV読込
          </button>

          <input
            ref={fileInputRef}
            className="hidden-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCSV}
          />

          <button className="export-btn" onClick={handleExport}>
            <Download size={20} />
            物品マスタCSV出力
          </button>

          <button className="add-btn" onClick={handleAddNew}>
            <Plus size={20} />
            新規登録
          </button>
        </div>
      </div>

      <div className="section-card">
        <p className="description">
          テンプレートCSVを出力し、Excelで物品情報を入力してから「物品マスタCSV読込」で一括登録できます。
          同じ品名がある場合はCSVの内容で上書きされます。
        </p>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing === "new" ? "物品の新規登録" : "物品の編集"}</h3>

            <form onSubmit={handleSubmit} className="entry-form">
              <FormGroup label="品名">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup label="分類">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(event) =>
                    setFormData({ ...formData, category: event.target.value })
                  }
                />
              </FormGroup>

              <FormGroup label="単位">
                <input
                  type="text"
                  placeholder="個、袋、箱など"
                  value={formData.unit}
                  onChange={(event) =>
                    setFormData({ ...formData, unit: event.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup label="保管場所">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(event) =>
                    setFormData({ ...formData, location: event.target.value })
                  }
                />
              </FormGroup>

              <FormGroup label="最低在庫数">
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(event) =>
                    setFormData({ ...formData, minStock: event.target.value })
                  }
                  required
                />
              </FormGroup>

              <FormGroup label="標準在庫数">
                <input
                  type="number"
                  min="0"
                  value={formData.targetStock}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      targetStock: event.target.value,
                    })
                  }
                  required
                />
              </FormGroup>

              <FormGroup label="発注先">
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(event) =>
                    setFormData({ ...formData, supplier: event.target.value })
                  }
                />
              </FormGroup>

              <FormGroup label="現在庫数">
                <input
                  type="number"
                  min="0"
                  value={formData.currentStock ?? 0}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      currentStock: event.target.value,
                    })
                  }
                />
              </FormGroup>

              <FormGroup label="備考" fullWidth>
                <textarea
                  value={formData.note}
                  onChange={(event) =>
                    setFormData({ ...formData, note: event.target.value })
                  }
                />
              </FormGroup>

              <div className="form-actions full-width">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(null)}
                >
                  キャンセル
                </button>

                <button type="submit" className="submit-btn">
                  <Save size={20} />
                  保存する
                </button>
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
                <th>現在庫</th>
                <th>発注先</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold">{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>{item.location}</td>
                  <td>
                    {item.minStock} / {item.targetStock}
                  </td>
                  <td className="font-bold">
                    {item.currentStock} {item.unit}
                  </td>
                  <td>{item.supplier}</td>
                  <td className="actions-cell">
                    <button
                      className="icon-btn edit"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-message">
                    登録物品はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );github.com/kanacyu99/zaiko_kanri_app/edit/main/src/App.jsx
}

function HistoryLog({ history, setHistory }) {
  const [editingId, setEditingId] = useState(null);
  const [editingNote, setEditingNote] = useState("");

  const handleExport = () => {
    const headers = [
      "日付",
      "区分",
      "品名",
      "数量",
      "登録者または使用者",
      "保管場所",
      "備考",
    ];

    const rows = history.map((log) => [
      log.date,
      log.type,
      log.itemName,
      log.quantity,
      log.user,
      log.location,
      log.note,
    ]);

    downloadCSV(`inventory_history_${getDateForFileName()}.csv`, headers, rows);
  };

  const getHistoryColor = (type) => {
    if (type === "入庫") return "status-green";
    if (type === "出庫") return "status-red";
    if (type === "棚卸し修正") return "status-blue";
    return "status-yellow";
  };

  const handleEditNote = (log) => {
    setEditingId(log.id);
    setEditingNote(log.note || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNote("");
  };

  const handleSaveNote = (id) => {
    setHistory((prevHistory) =>
      prevHistory.map((log) =>
        log.id === id
          ? {
              ...log,
              note: editingNote,
            }
          : log
      )
    );

    setEditingId(null);
    setEditingNote("");
    alert("訂正メモを保存しました。");
  };

  return (
    <div className="history">
      <div className="action-bar">
        <h2>入出庫履歴</h2>
        <button className="export-btn" onClick={handleExport}>
          <Download size={20} />
          入出庫履歴CSV出力
        </button>
      </div>

      <div className="section-card">
        <p className="description">
          入庫・出庫・棚卸し修正の履歴を確認できます。入力ミスや確認内容がある場合は、
          「訂正メモ」から備考を追記・修正できます。
        </p>

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
                <th>備考・訂正メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>
                      <span className={`status-badge ${getHistoryColor(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="font-bold">{log.itemName}</td>
                    <td>{log.quantity}</td>
                    <td>{log.user}</td>
                    <td>{log.location}</td>
                    <td>
                      {editingId === log.id ? (
                        <textarea
                          value={editingNote}
                          onChange={(event) => setEditingNote(event.target.value)}
                          placeholder="例：数量入力ミスのため確認済み、現物確認済み など"
                          style={{
                            width: "100%",
                            minHeight: "70px",
                            padding: "8px",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            fontFamily: "inherit",
                          }}
                        />
                      ) : (
                        log.note || "—"
                      )}
                    </td>
                    <td>
                      {editingId === log.id ? (
                        <div className="actions-cell">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleSaveNote(log.id)}
                            title="保存"
                          >
                            <Save size={16} />
                          </button>

                          <button
                            className="icon-btn delete"
                            onClick={handleCancelEdit}
                            title="キャンセル"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          className="icon-btn edit"
                          onClick={() => handleEditNote(log)}
                          title="訂正メモ"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-message">
                    履歴はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ShortageList({ items }) {
  const lowStockItems = items.filter(
    (item) => Number(item.currentStock) < Number(item.minStock)
  );

  const handleExport = () => {
    const headers = [
      "品名",
      "現在庫数",
      "最低在庫数",
      "標準在庫数",
      "不足数",
      "単位",
      "発注先",
      "保管場所",
    ];

    const rows = lowStockItems.map((item) => [
      item.name,
      item.currentStock,
      item.minStock,
      item.targetStock,
      Number(item.targetStock) - Number(item.currentStock),
      item.unit,
      item.supplier,
      item.location,
    ]);

    downloadCSV(`inventory_shortage_${getDateForFileName()}.csv`, headers, rows);
  };

  return (
    <div className="shortage">
      <div className="action-bar">
        <h2>在庫不足リスト</h2>
        <button className="export-btn" onClick={handleExport}>
          <Download size={20} />
          在庫不足CSV出力
        </button>
      </div>

      <div className="section-card">
        <p className="description">
          最低在庫数を下回っている物品を表示しています。
        </p>

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
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td>
                    <td className="text-red font-bold">
                      {item.currentStock} {item.unit}
                    </td>
                    <td>
                      {item.minStock} {item.unit}
                    </td>
                    <td className="font-bold">
                      {Number(item.targetStock) - Number(item.currentStock)}{" "}
                      {item.unit}
                    </td>
                    <td>{item.supplier}</td>
                    <td>{item.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-message">
                    在庫不足の物品はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stocktaking({
  items,
  setItems,
  setHistory,
  stocktakingLogs,
  setStocktakingLogs,
}) {
  const [formData, setFormData] = useState({
    date: getToday(),
    itemId: "",
    systemStock: "",
    actualStock: "",
    reason: "",
    checker: "",
    note: "",
    updateStock: true,
  });

  const selectedItem = items.find((item) => item.id === formData.itemId);

  const diff =
    formData.actualStock === "" || formData.systemStock === ""
      ? ""
      : Number(formData.actualStock) - Number(formData.systemStock);

  const diffInfo = getDiffInfo(diff);

  const handleSelectItem = (itemId) => {
    const item = items.find((target) => target.id === itemId);
    setFormData({
      ...formData,
      itemId,
      systemStock: item ? Number(item.currentStock) : "",
      actualStock: "",
      reason: "",
      note: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.date || !formData.itemId || formData.actualStock === "" || !formData.checker) {
      alert("棚卸し日、品名、実在庫数、確認者は必須です。");
      return;
    }

    if (Number(formData.actualStock) < 0) {
      alert("実在庫数にマイナスは入力できません。");
      return;
    }

    if (!selectedItem) {
      alert("物品を選択してください。");
      return;
    }

    const systemStock = Number(formData.systemStock);
    const actualStock = Number(formData.actualStock);
    const calculatedDiff = actualStock - systemStock;

    const newLog = {
      id: Date.now(),
      date: formData.date,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      systemStock,
      actualStock,
      diff: calculatedDiff,
      reason: formData.reason,
      checker: formData.checker,
      updatedStock: formData.updateStock,
      note: formData.note,
    };

    setStocktakingLogs((prev) => [newLog, ...prev]);

    if (formData.updateStock) {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedItem.id
            ? { ...item, currentStock: actualStock }
            : item
        )
      );

      const historyNote = [
        formData.reason ? `差異理由：${formData.reason}` : "",
        formData.note ? `備考：${formData.note}` : "",
      ]
        .filter(Boolean)
        .join(" / ");

      const newHistory = {
        id: Date.now() + 1,
        type: "棚卸し修正",
        date: formData.date,
        itemName: selectedItem.name,
        quantity: calculatedDiff,
        user: formData.checker,
        location: selectedItem.location,
        note: historyNote,
      };

      setHistory((prev) => [newHistory, ...prev]);
    }

    alert("棚卸し結果を登録しました。");

    setFormData({
      date: getToday(),
      itemId: "",
      systemStock: "",
      actualStock: "",
      reason: "",
      checker: "",
      note: "",
      updateStock: true,
    });
  };

  const handleExport = () => {
    const headers = [
      "棚卸し日",
      "品名",
      "システム在庫数",
      "実在庫数",
      "差異",
      "差異理由",
      "確認者",
      "在庫修正の有無",
      "備考",
    ];

    const rows = stocktakingLogs.map((log) => [
      log.date,
      log.itemName,
      log.systemStock,
      log.actualStock,
      log.diff,
      log.reason,
      log.checker,
      log.updatedStock ? "修正あり" : "記録のみ",
      log.note,
    ]);

    downloadCSV(
      `inventory_stocktaking_${getDateForFileName()}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="stocktaking">
      <div className="action-bar">
        <h2>棚卸し</h2>
        <button className="export-btn" onClick={handleExport}>
          <Download size={20} />
          棚卸しCSV出力
        </button>
      </div>

      <div className="section-card">
        <h3>棚卸し入力</h3>

        <form onSubmit={handleSubmit} className="entry-form">
          <FormGroup label="棚卸し日">
            <input
              type="date"
              value={formData.date}
              onChange={(event) =>
                setFormData({ ...formData, date: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="品名">
            <select
              value={formData.itemId}
              onChange={(event) => handleSelectItem(event.target.value)}
              required
            >
              <option value="">選択してください</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}（現在庫：{item.currentStock} {item.unit}）
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="システム在庫数">
            <input
              className="readonly-input"
              type="number"
              value={formData.systemStock}
              readOnly
            />
          </FormGroup>

          <FormGroup label="実在庫数">
            <input
              type="number"
              min="0"
              value={formData.actualStock}
              onChange={(event) =>
                setFormData({ ...formData, actualStock: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="差異">
            <div className="diff-display">
              <span>{diff === "" ? "-" : diff}</span>
              <span className={`status-badge ${diffInfo.color}`}>
                {diffInfo.label}
              </span>
            </div>
          </FormGroup>

          <FormGroup label="差異理由">
            <input
              type="text"
              placeholder="例：記入漏れ、破損、廃棄、数え間違いなど"
              value={formData.reason}
              onChange={(event) =>
                setFormData({ ...formData, reason: event.target.value })
              }
            />
          </FormGroup>

          <FormGroup label="確認者">
            <input
              type="text"
              value={formData.checker}
              onChange={(event) =>
                setFormData({ ...formData, checker: event.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup label="在庫修正">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.updateStock}
                onChange={(event) =>
                  setFormData({ ...formData, updateStock: event.target.checked })
                }
              />
              在庫数を実在庫数に修正する
            </label>
          </FormGroup>

          <FormGroup label="備考" fullWidth>
            <textarea
              value={formData.note}
              onChange={(event) =>
                setFormData({ ...formData, note: event.target.value })
              }
            />
          </FormGroup>

          <div className="form-actions full-width">
            <button type="submit" className="submit-btn">
              <ClipboardCheck size={20} />
              棚卸し結果を登録する
            </button>
          </div>
        </form>
      </div>

      <div className="section-card">
        <h3>棚卸し履歴</h3>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>棚卸し日</th>
                <th>品名</th>
                <th>システム在庫</th>
                <th>実在庫</th>
                <th>差異</th>
                <th>状態</th>
                <th>差異理由</th>
                <th>確認者</th>
                <th>在庫修正</th>
                <th>備考</th>
              </tr>
            </thead>

            <tbody>
              {stocktakingLogs.length > 0 ? (
                stocktakingLogs.map((log) => {
                  const info = getDiffInfo(log.diff);
                  return (
                    <tr
                      key={log.id}
                      className={Number(log.diff) !== 0 ? "row-highlight" : ""}
                    >
                      <td>{log.date}</td>
                      <td className="font-bold">{log.itemName}</td>
                      <td>{log.systemStock}</td>
                      <td>{log.actualStock}</td>
                      <td className={Number(log.diff) < 0 ? "text-red" : ""}>
                        {log.diff}
                      </td>
                      <td>
                        <span className={`status-badge ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td>{log.reason}</td>
                      <td>{log.checker}</td>
                      <td>{log.updatedStock ? "修正あり" : "記録のみ"}</td>
                      <td>{log.note}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="empty-message">
                    棚卸し履歴はありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Backup({
  items,
  history,
  stocktakingLogs,
  setItems,
  setHistory,
  setStocktakingLogs,
  setActiveTab,
}) {
  const fileInputRef = useRef(null);

  const handleBackupExport = () => {
    const backupData = {
      appName: "在庫管理システム",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      items,
      history,
      stocktakingLogs,
    };

    const jsonText = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonText], {
      type: "application/json;charset=utf-8;",
    });

    downloadBlob(blob, `inventory_backup_${getDateTimeForFileName()}.json`);
    alert("バックアップファイルを出力しました。");
  };

  const handleRestore = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const text = loadEvent.target.result;
        const parsedData = JSON.parse(text);

        const isValid =
          Array.isArray(parsedData.items) &&
          Array.isArray(parsedData.history) &&
          Array.isArray(parsedData.stocktakingLogs);

        if (!isValid) {
          alert("バックアップファイルの形式が正しくありません。");
          clearFileInput();
          return;
        }

        const confirmed = window.confirm(
          "現在の在庫データ、入出庫履歴、棚卸し履歴がバックアップデータで上書きされます。復元してよろしいですか？"
        );

        if (!confirmed) {
          clearFileInput();
          return;
        }

        setItems(parsedData.items);
        setHistory(parsedData.history);
        setStocktakingLogs(parsedData.stocktakingLogs);

        localStorage.setItem("zaiko_items", JSON.stringify(parsedData.items));
        localStorage.setItem("zaiko_history", JSON.stringify(parsedData.history));
        localStorage.setItem(
          "inventory_stocktaking_logs",
          JSON.stringify(parsedData.stocktakingLogs)
        );

        alert("バックアップデータを復元しました。");
        clearFileInput();
        setActiveTab("dashboard");
      } catch (error) {
        alert("バックアップファイルを読み込めませんでした。");
        clearFileInput();
      }
    };

    reader.onerror = () => {
      alert("バックアップファイルを読み込めませんでした。");
      clearFileInput();
    };

    reader.readAsText(file, "utf-8");
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="backup-page">
      <div className="action-bar">
        <h2>バックアップ</h2>
      </div>

      <div className="backup-grid">
        <div className="backup-card">
          <div className="stat-label">物品マスタ件数</div>
          <div className="stat-value">{items.length}</div>
        </div>

        <div className="backup-card">
          <div className="stat-label">入出庫履歴件数</div>
          <div className="stat-value">{history.length}</div>
        </div>

        <div className="backup-card">
          <div className="stat-label">棚卸し履歴件数</div>
          <div className="stat-value">{stocktakingLogs.length}</div>
        </div>
      </div>

      <div className="section-card">
        <h3>バックアップ出力</h3>
        <p className="description">
          バックアップ出力を行うと、現在の在庫データをJSONファイルとして保存できます。
          PCの変更やブラウザのデータ消去に備えて、定期的にバックアップを保存してください。
        </p>

        <div className="backup-actions">
          <button className="backup-btn" onClick={handleBackupExport}>
            <Download size={20} />
            バックアップ出力
          </button>
        </div>
      </div>

      <div className="section-card restore-section">
        <h3>バックアップ復元</h3>
        <p className="description">
          バックアップ復元を行うと、保存していたJSONファイルから在庫データを復元できます。
          現在のデータは上書きされます。
        </p>

        <div className="backup-warning">
          注意：復元すると、現在の在庫データ・入出庫履歴・棚卸し履歴は、
          選択したバックアップファイルの内容に置き換わります。
        </div>

        <div className="backup-actions">
          <label className="restore-btn">
            <Upload size={20} />
            バックアップJSONを選択して復元
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleRestore}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, children, fullWidth = false }) {
  return (
    <div className={`form-group ${fullWidth ? "full-width" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function getDiffInfo(diff) {
  if (diff === "" || diff === null || diff === undefined) {
    return { label: "未入力", color: "status-yellow" };
  }

  const numericDiff = Number(diff);

  if (numericDiff === 0) {
    return { label: "差異なし", color: "status-green" };
  }

  if (numericDiff > 0) {
    return { label: "実在庫が多い", color: "status-blue" };
  }

  return { label: "実在庫が少ない", color: "status-red" };
}

export default App;
