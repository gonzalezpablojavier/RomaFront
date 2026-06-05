import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';



interface AppContextProps {
  active: string;
  setActive: React.Dispatch<React.SetStateAction<string>>;
  showCustomizer: boolean;
  setShowCustomizer: React.Dispatch<React.SetStateAction<boolean>>;
  showCustomizer2: boolean;
  setShowCustomizer2: React.Dispatch<React.SetStateAction<boolean>>;
  currentTotals: boolean;
  setCurrentTotals: React.Dispatch<React.SetStateAction<boolean>>;
  loadingTotals: boolean;
  setLoadingTotals: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  posibleValue: string;
  setPosibleValue: React.Dispatch<React.SetStateAction<string>>;
  brands: Brand_Props[];
  setBrands: React.Dispatch<React.SetStateAction<Brand_Props[]>>;
  selectedBrands: Brand_Props[];
  setSelectedBrands: React.Dispatch<React.SetStateAction<Brand_Props[]>>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  showBrands: string;
  setShowBrands: React.Dispatch<React.SetStateAction<string>>;
  date1: string;
  setDate1: React.Dispatch<React.SetStateAction<string>>;
  date2: string;
  setDate2: React.Dispatch<React.SetStateAction<string>>;
  monthsDiff: number;
  setMonthsDiff: React.Dispatch<React.SetStateAction<number>>;
  quick: string | null;
  setQuick: React.Dispatch<React.SetStateAction<string | null>>;
  type: string | null;
  setType: React.Dispatch<React.SetStateAction<string | null>>;
  ofer: string | null;
  setOfer: React.Dispatch<React.SetStateAction<string | null>>;
  oferAmount: number | string;
  setOferAmount: React.Dispatch<React.SetStateAction<number | string>>;
  sap: number | string;
  setSap: React.Dispatch<React.SetStateAction<number | string>>;
  aam: AamType;
  setAam: React.Dispatch<React.SetStateAction<AamType>>;
  valueForCriticos: number;
  setValueForCriticos: React.Dispatch<React.SetStateAction<number>>;
  promIrr: number | string;
  setPromIrr: React.Dispatch<React.SetStateAction<number | string>>;
  tooltipVisible: boolean;
  setTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>;
  location: string[];
  setLocation: React.Dispatch<React.SetStateAction<string[]>>;
  order: string;
  setOrder: React.Dispatch<React.SetStateAction<string>>;
  settingsCombo: any;
  setSettingsCombo: React.Dispatch<React.SetStateAction<any>>;
  showTotals: boolean;
  setShowTotals: React.Dispatch<React.SetStateAction<boolean>>;
  totalsInfo: TotalsType | null;
  setTotalsInfo: React.Dispatch<React.SetStateAction<TotalsType | null>>;
  responseArticles: article[];
  setResponseArticles: React.Dispatch<React.SetStateAction<article[]>>;
  eqs: eq[];
  setEqs: React.Dispatch<React.SetStateAction<eq[]>>;
  paginatedArticles: article[];
  setPaginatedArticles: React.Dispatch<React.SetStateAction<article[]>>;
  renderArticles: article[];
  setRenderArticles: React.Dispatch<React.SetStateAction<article[]>>;
  tableBottom: boolean;
  setTableBottom: React.Dispatch<React.SetStateAction<boolean>>;
  loadingRows: boolean;
  setLoadingRows: React.Dispatch<React.SetStateAction<boolean>>;
  searching: boolean;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  freePass: boolean;
  setFreePass: React.Dispatch<React.SetStateAction<boolean>>;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;

  recoAuto: boolean;
  setRecoAuto: React.Dispatch<React.SetStateAction<boolean>>;


  totalPedido: number;
  setTotalPedido: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoMoney: number;
  setTotalPedidoMoney: React.Dispatch<React.SetStateAction<number>>;
  totalUnitsEqsProm: number;
  setTotalUnitsEqsProm: React.Dispatch<React.SetStateAction<number>>;
  totalMoneyEqsProm: number;
  setTotalMoneyEqsProm: React.Dispatch<React.SetStateAction<number>>;
  totalUnitsEqsPend: number;
  setTotalUnitsEqsPend: React.Dispatch<React.SetStateAction<number>>;
  totalMoneyEqsPend: number;
  setTotalMoneyEqsPend: React.Dispatch<React.SetStateAction<number>>;

  // transfers
  mdpToBa: number;
  setMdpToBa: React.Dispatch<React.SetStateAction<number>>;
  baToGp: number;
  setBaToGp: React.Dispatch<React.SetStateAction<number>>;
  gpToMdp: number;
  setGpToMdp: React.Dispatch<React.SetStateAction<number>>;
  baToMdp: number;
  setBaToMdp: React.Dispatch<React.SetStateAction<number>>;
  gpToBa: number;
  setGpToBa: React.Dispatch<React.SetStateAction<number>>;
  mdpToGp: number;
  setMdpToGp: React.Dispatch<React.SetStateAction<number>>;
  mdpToBaMoney: number;
  setMdpToBaMoney: React.Dispatch<React.SetStateAction<number>>;
  baToGpMoney: number;
  setBaToGpMoney: React.Dispatch<React.SetStateAction<number>>;
  gpToMdpMoney: number;
  setGpToMdpMoney: React.Dispatch<React.SetStateAction<number>>;
  baToMdpMoney: number;
  setBaToMdpMoney: React.Dispatch<React.SetStateAction<number>>;
  gpToBaMoney: number;
  setGpToBaMoney: React.Dispatch<React.SetStateAction<number>>;
  mdpToGpMoney: number;
  setMdpToGpMoney: React.Dispatch<React.SetStateAction<number>>;
  mdpToBaModified: number;
  setMdpToBaModified: React.Dispatch<React.SetStateAction<number>>;
  baToGpModified: number;
  setBaToGpModified: React.Dispatch<React.SetStateAction<number>>;
  gpToMdpModified: number;
  setGpToMdpModified: React.Dispatch<React.SetStateAction<number>>;
  baToMdpModified: number;
  setBaToMdpModified: React.Dispatch<React.SetStateAction<number>>;
  gpToBaModified: number;
  setGpToBaModified: React.Dispatch<React.SetStateAction<number>>;
  mdpToGpModified: number;
  setMdpToGpModified: React.Dispatch<React.SetStateAction<number>>;

  //totales

  totalPedidoGP: number;
  setTotalPedidoGP: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoBA: number;
  setTotalPedidoBA: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoMDP: number;
  setTotalPedidoMDP: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoGPMoney: number;
  setTotalPedidoGPMoney: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoBAMoney: number;
  setTotalPedidoBAMoney: React.Dispatch<React.SetStateAction<number>>;
  totalPedidoMDPMoney: number;
  setTotalPedidoMDPMoney: React.Dispatch<React.SetStateAction<number>>;
}

interface AppProviderProps {
  children: ReactNode;
}

interface Brand_Props {
  codigoMarca: string;
  descripcion: string;
  fechaModificacion: string;
  numeroTransaccion: number;
  margen1: number;
  margen2: number;
  margen3: number;
  margen4: number;
  margen5: number;
  muestraWeb: number;
}

interface eq {
  id_articulo: string;
  id_marca: string;
  equivalencias: string;
}

interface article {
  id_articulo: string;
  activo: number;
  nombre_articulo: string;
  id_rubro: string;
  id_marca: string;
  codigo_proveedor: string;
  codigo_particular: string;
  codigo_grupoalternativo: number | null;
  fecha_mod: string;
  fecha_alta: string;
  precio_lista: number;
  precio_costo: number;
  sobre_stock?: boolean;
  pedir_igual?: boolean;
  pedir_minimo: number;
  pedir_multiplo: number;
  equivalencia?: string[];
  codigo_deposito?: number;
  total?: number;
  cantidadVentas?: number;
  pendientes_GP: number;
  pendientes_MDP: number;
  pendientes_BA: number;
  stock_GP: number;
  stock_MDP: number;
  stock_BA: number;
  promedio_ventas_GP?: number;
  promedio_ventas_MDP?: number;
  promedio_ventas_BA?: number;
  recomendado_GP: number;
  recomendado_BA: number;
  recomendado_MDP: number;
  rotation: number;
  recomendado_GP_modified?: number;
  recomendado_BA_modified?: number;
  recomendado_MDP_modified?: number;
  compra_GP_modified?: number;
  compra_BA_modified?: number;
  compra_MDP_modified?: number;
  transfer: {
    GP_to_MDP: number;
    GP_to_BA: number;
    MDP_to_GP: number;
    MDP_to_BA: number;
    BA_to_GP: number;
    BA_to_MDP: number;
    GP_to_MDP_modified?: number;
    GP_to_BA_modified?: number;
    MDP_to_GP_modified?: number;
    MDP_to_BA_modified?: number;
    BA_to_GP_modified?: number;
    BA_to_MDP_modified?: number;
  };
  eqPromUnits?: number;
  eqPromMoney?: number;
}

interface AamType {
  type: string[]; // a b c
  condition: string[]; // criticos - nuevos
}

interface TotalsType {
  stock: {
    totalStockBA: number;
    totalStockGP: number;
    totalStockMDP: number;
    totalStock: number;
  };
  salesTotalFormatted: {
    salesProm: number;
    salesPromMoney: number;
  };
  pendings: {
    totalPendientesBA: number;
    totalPendientesGP: number;
    totalPendientesMDP: number;
    totalPendientes: number;
  };
  pendingTotalMoneyFormatted: {
    totalMoneyPendingBA: number;
    totalMoneyPendingGP: number;
    totalMoneyPendingMDP: number;
    totalMoneyPending: number;
  };
  totalMoneyStockFormatted: {
    totalMoneyStockBA: number;
    totalMoneyStockGP: number;
    totalMoneyStockMDP: number;
    totalMoneyStock: number;
  };
  sales: {
    salesProm: number;
    salesPromBA: number;
    salesPromGP: number;
    salesPromMDP: number;
  }
  salesTotalMoneyFormatted: {
    salesPromMoney: number
    salesPromMoneyBA: number
    salesPromMoneyGP: number
    salesPromMoneyMDP: number
  };
  recommended: {
    totalRecommended: number
    recommendedBA: number
    recommendedGP: number
    recommendedMDP: number
  };
  totalMoneyRecommendedFormatted: {
    totalMoneyRecommended: number
    recommendedMoneyBA: number
    recommendedMoneyGP: number
    recommendedMoneyMDP: number
  };
  //filteredAvgMoney: string;
  //totalMoneyRoundedPeso: string;
  //totalUnitsAverage: number;
  //totalUnits: number;
  //pendientesTotal: number;
  //stockTotal: number;
  //pendingTotalMoney: number;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // para page
  const [active, setActive] = useState<string>('');
  const [showCustomizer, setShowCustomizer] = useState<boolean>(true);
  const [showCustomizer2, setShowCustomizer2] = useState<boolean>(false);
  const [currentTotals, setCurrentTotals] = useState<boolean>(false);
  const [loadingTotals, setLoadingTotals] = useState<boolean>(false);
  const [loadingRows, setLoadingRows] = useState<boolean>(false);

  // para filtros
  const [name, setName] = useState<string>('');
  const [posibleValue, setPosibleValue] = useState<string>('');
  const [brands, setBrands] = useState<Brand_Props[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Brand_Props[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBrands, setShowBrands] = useState<string>(''); // dropDown de las marcas
  const [date1, setDate1] = useState<string>(() => {
    const currentDate = new Date();
    const lastYearDate = new Date(currentDate);
    lastYearDate.setFullYear(currentDate.getFullYear() - 1);
    return lastYearDate.toISOString().slice(0, 10);
  }); // hace un año
  const [date2, setDate2] = useState<string>(new Date().toISOString().slice(0, 10));
  const [monthsDiff, setMonthsDiff] = useState<number>(12);
  const [quick, setQuick] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [ofer, setOfer] = useState<string | null>('no');
  const [oferAmount, setOferAmount] = useState<number | string>('');
  const [sap, setSap] = useState<number | string>(''); // stock a pedir
  const [aam, setAam] = useState<AamType>({ type: [], condition: [] }); // art a mostrar
  const [valueForCriticos, setValueForCriticos] = useState<number>(1.5);
  const [promIrr, setPromIrr] = useState<number | string>('');
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [location, setLocation] = useState<string[]>(['MDP', 'BA', 'GP']);
  const [order, setOrder] = useState<string>('codigo');
  const [settingsCombo, setSettingsCombo] = useState<any>({});

  const [showTotals, setShowTotals] = useState<boolean>(false);
  const [totalsInfo, setTotalsInfo] = useState<TotalsType | null>(null);
  const [responseArticles, setResponseArticles] = useState<article[]>([]);
  const [eqs, setEqs] = useState<eq[]>([]);

  const [paginatedArticles, setPaginatedArticles] = useState<article[]>([]);
  const [renderArticles, setRenderArticles] = useState<article[]>([]);
  const [tableBottom, setTableBottom] = useState<boolean>(false);

  const [freePass, setFreePass] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [recoAuto, setRecoAuto] = useState<boolean>(true);

  ///// buscador

  const [searching, setSearching] = useState<boolean>(false);

  const [totalPedido, setTotalPedido] = useState<number>(0);

  const [totalPedidoMoney, setTotalPedidoMoney] = useState<number>(0);

  const [totalUnitsEqsProm, setTotalUnitsEqsProm] = useState<number>(0);
  const [totalMoneyEqsProm, setTotalMoneyEqsProm] = useState<number>(0);

  const [totalUnitsEqsPend, setTotalUnitsEqsPend] = useState<number>(0);
  const [totalMoneyEqsPend, setTotalMoneyEqsPend] = useState<number>(0);

  //// transfers
  const [mdpToBa, setMdpToBa] = useState<number>(0);
  const [baToGp, setBaToGp] = useState<number>(0);
  const [gpToMdp, setGpToMdp] = useState<number>(0);
  const [baToMdp, setBaToMdp] = useState<number>(0);
  const [gpToBa, setGpToBa] = useState<number>(0);
  const [mdpToGp, setMdpToGp] = useState<number>(0);

  const [mdpToBaMoney, setMdpToBaMoney] = useState<number>(0);
  const [baToGpMoney, setBaToGpMoney] = useState<number>(0);
  const [gpToMdpMoney, setGpToMdpMoney] = useState<number>(0);
  const [baToMdpMoney, setBaToMdpMoney] = useState<number>(0);
  const [gpToBaMoney, setGpToBaMoney] = useState<number>(0);
  const [mdpToGpMoney, setMdpToGpMoney] = useState<number>(0);

  const [mdpToBaModified, setMdpToBaModified] = useState<number>(0);
  const [baToGpModified, setBaToGpModified] = useState<number>(0);
  const [gpToMdpModified, setGpToMdpModified] = useState<number>(0);
  const [baToMdpModified, setBaToMdpModified] = useState<number>(0);
  const [gpToBaModified, setGpToBaModified] = useState<number>(0);
  const [mdpToGpModified, setMdpToGpModified] = useState<number>(0);

  const [totalPedidoGP, setTotalPedidoGP] = useState<number>(0);
  const [totalPedidoBA, setTotalPedidoBA] = useState<number>(0);
  const [totalPedidoMDP, setTotalPedidoMDP] = useState<number>(0);

  const [totalPedidoGPMoney, setTotalPedidoGPMoney] = useState<number>(0);
  const [totalPedidoBAMoney, setTotalPedidoBAMoney] = useState<number>(0);
  const [totalPedidoMDPMoney, setTotalPedidoMDPMoney] = useState<number>(0);



  return (
    <AppContext.Provider
      value={{
        active,
        setActive,
        showCustomizer,
        setShowCustomizer,
        showCustomizer2,
        setShowCustomizer2,
        currentTotals,
        setCurrentTotals,
        loadingTotals,
        setLoadingTotals,
        name,
        setName,
        posibleValue,
        setPosibleValue,
        brands,
        setBrands,
        selectedBrands,
        setSelectedBrands,
        scrollContainerRef,
        showBrands,
        setShowBrands,
        date1,
        setDate1,
        date2,
        setDate2,
        monthsDiff, 
        setMonthsDiff,
        quick,
        setQuick,
        type,
        setType,
        ofer,
        setOfer,
        oferAmount,
        setOferAmount,
        settingsCombo,
        setSettingsCombo,
        sap,
        setSap,
        aam,
        setAam,
        valueForCriticos,
        setValueForCriticos,
        promIrr,
        setPromIrr,
        tooltipVisible,
        setTooltipVisible,
        location,
        setLocation,
        order,
        setOrder,
        showTotals,
        setShowTotals,
        totalsInfo,
        setTotalsInfo,
        responseArticles,
        setResponseArticles,
        eqs,
        setEqs,
        paginatedArticles,
        setPaginatedArticles,
        renderArticles,
        setRenderArticles,
        tableBottom,
        setTableBottom,
        loadingRows,
        setLoadingRows,
        searching,
        setSearching,
        freePass, 
        setFreePass,
        editing,
        setEditing,
        editingIndex,
        setEditingIndex,
        recoAuto, 
        setRecoAuto,

        totalPedido,
        setTotalPedido,
        totalPedidoMoney,
        setTotalPedidoMoney,
        totalUnitsEqsProm,
        setTotalUnitsEqsProm,
        totalMoneyEqsProm,
        setTotalMoneyEqsProm,
        totalMoneyEqsPend,
        setTotalMoneyEqsPend,
        totalUnitsEqsPend,
        setTotalUnitsEqsPend,

        mdpToBa,
        setMdpToBa,
        baToGp, 
        setBaToGp,
        gpToMdp, 
        setGpToMdp,
        baToMdp,
        setBaToMdp,
        gpToBa,
        setGpToBa,
        mdpToGp,
        setMdpToGp,
        mdpToBaMoney,
        setMdpToBaMoney,
        baToGpMoney, 
        setBaToGpMoney,
        gpToMdpMoney, 
        setGpToMdpMoney,
        baToMdpMoney, 
        setBaToMdpMoney,
        gpToBaMoney, 
        setGpToBaMoney,
        mdpToGpMoney, 
        setMdpToGpMoney,

        mdpToBaModified,
        setMdpToBaModified,
        baToGpModified, 
        setBaToGpModified,
        gpToMdpModified, 
        setGpToMdpModified,
        baToMdpModified, 
        setBaToMdpModified,
        gpToBaModified, 
        setGpToBaModified,
        mdpToGpModified, 
        setMdpToGpModified,

        totalPedidoGP, 
        setTotalPedidoGP,
        totalPedidoBA, 
        setTotalPedidoBA,
        totalPedidoMDP, 
        setTotalPedidoMDP,
        totalPedidoGPMoney, 
        setTotalPedidoGPMoney,
        totalPedidoBAMoney, 
        setTotalPedidoBAMoney,
        totalPedidoMDPMoney, 
        setTotalPedidoMDPMoney,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
