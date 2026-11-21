export namespace analytics {
	
	export class Bucket {
	    key: string;
	    up: number;
	    down: number;
	
	    static createFrom(source: any = {}) {
	        return new Bucket(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.up = source["up"];
	        this.down = source["down"];
	    }
	}
	export class Item {
	    id: string;
	    name: string;
	    sub: string;
	    path: string;
	    up: number;
	    down: number;
	    seconds: number;
	
	    static createFrom(source: any = {}) {
	        return new Item(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sub = source["sub"];
	        this.path = source["path"];
	        this.up = source["up"];
	        this.down = source["down"];
	        this.seconds = source["seconds"];
	    }
	}
	export class Routes {
	    proxy: number;
	    direct: number;
	    blocked: number;
	
	    static createFrom(source: any = {}) {
	        return new Routes(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.proxy = source["proxy"];
	        this.direct = source["direct"];
	        this.blocked = source["blocked"];
	    }
	}
	export class ReportTotals {
	    up: number;
	    down: number;
	    seconds: number;
	    sessions: number;
	    activeDays: number;
	
	    static createFrom(source: any = {}) {
	        return new ReportTotals(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.up = source["up"];
	        this.down = source["down"];
	        this.seconds = source["seconds"];
	        this.sessions = source["sessions"];
	        this.activeDays = source["activeDays"];
	    }
	}
	export class Report {
	    period: string;
	    hourly: boolean;
	    totals: ReportTotals;
	    series: Bucket[];
	    profiles: Item[];
	    nodes: Item[];
	    apps: Item[];
	    routes: Routes;
	    since: string;
	
	    static createFrom(source: any = {}) {
	        return new Report(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.period = source["period"];
	        this.hourly = source["hourly"];
	        this.totals = this.convertValues(source["totals"], ReportTotals);
	        this.series = this.convertValues(source["series"], Bucket);
	        this.profiles = this.convertValues(source["profiles"], Item);
	        this.nodes = this.convertValues(source["nodes"], Item);
	        this.apps = this.convertValues(source["apps"], Item);
	        this.routes = this.convertValues(source["routes"], Routes);
	        this.since = source["since"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

export namespace dto {
	
	export class AppearanceDetailsData {
	    font: string;
	    radius: string;
	    animation: string;
	
	    static createFrom(source: any = {}) {
	        return new AppearanceDetailsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.font = source["font"];
	        this.radius = source["radius"];
	        this.animation = source["animation"];
	    }
	}
	export class ApplicationSettingsData {
	    launchOnStartup: boolean;
	    minimizeToTray: boolean;
	    autoConnect: boolean;
	    disableSubscriptionAutoRefresh: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ApplicationSettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.launchOnStartup = source["launchOnStartup"];
	        this.minimizeToTray = source["minimizeToTray"];
	        this.autoConnect = source["autoConnect"];
	        this.disableSubscriptionAutoRefresh = source["disableSubscriptionAutoRefresh"];
	    }
	}
	export class ConnectionSettingsData {
	    mode: string;
	    proxyType: string;
	    proxyHost: string;
	    proxyPort: number;
	    tunName: string;
	    primaryDns: string;
	    secondaryDns: string;
	    proxyDns: string;
	    dnsOverVpn: boolean;
	    mtu: number;
	    stack: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionSettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.proxyType = source["proxyType"];
	        this.proxyHost = source["proxyHost"];
	        this.proxyPort = source["proxyPort"];
	        this.tunName = source["tunName"];
	        this.primaryDns = source["primaryDns"];
	        this.secondaryDns = source["secondaryDns"];
	        this.proxyDns = source["proxyDns"];
	        this.dnsOverVpn = source["dnsOverVpn"];
	        this.mtu = source["mtu"];
	        this.stack = source["stack"];
	    }
	}
	export class CustomFontData {
	    id: string;
	    name: string;
	    ext: string;
	
	    static createFrom(source: any = {}) {
	        return new CustomFontData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.ext = source["ext"];
	    }
	}
	export class HwidSettingsData {
	    enabled: boolean;
	    mode: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new HwidSettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.mode = source["mode"];
	        this.value = source["value"];
	    }
	}
	export class PingSettingsData {
	    nodeMode: string;
	    connectionMode: string;
	
	    static createFrom(source: any = {}) {
	        return new PingSettingsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodeMode = source["nodeMode"];
	        this.connectionMode = source["connectionMode"];
	    }
	}
	export class ProTunLayerData {
	    graph: types.ProTunGraph;
	    locked: boolean;
	    preset: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProTunLayerData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.graph = this.convertValues(source["graph"], types.ProTunGraph);
	        this.locked = source["locked"];
	        this.preset = source["preset"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunScopeData {
	    id: string;
	    name: string;
	    hasRules: boolean;
	    hasPreset: boolean;
	    locked: boolean;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProTunScopeData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.hasRules = source["hasRules"];
	        this.hasPreset = source["hasPreset"];
	        this.locked = source["locked"];
	        this.active = source["active"];
	    }
	}
	export class ProTunScopesData {
	    activeId: string;
	    global: boolean;
	    profiles: ProTunScopeData[];
	
	    static createFrom(source: any = {}) {
	        return new ProTunScopesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.activeId = source["activeId"];
	        this.global = source["global"];
	        this.profiles = this.convertValues(source["profiles"], ProTunScopeData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunStateData {
	    graph: types.ProTunGraph;
	    locked: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProTunStateData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.graph = this.convertValues(source["graph"], types.ProTunGraph);
	        this.locked = source["locked"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProfileData {
	    id: string;
	    name: string;
	    provider: string;
	    url: string;
	    announce?: string;
	    dataLimit: number;
	    dataUsed: number;
	    expiresAt: string;
	    createdAt: string;
	    updatedAt: string;
	    isActive: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProfileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.provider = source["provider"];
	        this.url = source["url"];
	        this.announce = source["announce"];
	        this.dataLimit = source["dataLimit"];
	        this.dataUsed = source["dataUsed"];
	        this.expiresAt = source["expiresAt"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.isActive = source["isActive"];
	    }
	}
	export class SplitTunnelConflictData {
	    value: string;
	    target: string;
	
	    static createFrom(source: any = {}) {
	        return new SplitTunnelConflictData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.value = source["value"];
	        this.target = source["target"];
	    }
	}
	export class WallpaperInfo {
	    available: boolean;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new WallpaperInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.version = source["version"];
	    }
	}

}

export namespace profile {
	
	export class PingResult {
	    nodeId: string;
	    latency: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new PingResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodeId = source["nodeId"];
	        this.latency = source["latency"];
	        this.status = source["status"];
	    }
	}

}

export namespace settings {
	
	export class BackdropSettings {
	    mode: string;
	    blur: number;
	    dim: number;
	    density: number;
	    style: string;
	    photoVersion?: string;
	
	    static createFrom(source: any = {}) {
	        return new BackdropSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.blur = source["blur"];
	        this.dim = source["dim"];
	        this.density = source["density"];
	        this.style = source["style"];
	        this.photoVersion = source["photoVersion"];
	    }
	}
	export class MuxSettings {
	    enabled: boolean;
	    concurrency: number;
	    xudpConcurrency: number;
	    xudpProxyUDP443: string;
	
	    static createFrom(source: any = {}) {
	        return new MuxSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.concurrency = source["concurrency"];
	        this.xudpConcurrency = source["xudpConcurrency"];
	        this.xudpProxyUDP443 = source["xudpProxyUDP443"];
	    }
	}
	export class NoiseSettings {
	    type: string;
	    packet: string;
	    delay: string;
	
	    static createFrom(source: any = {}) {
	        return new NoiseSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.packet = source["packet"];
	        this.delay = source["delay"];
	    }
	}
	export class FragmentSettings {
	    enabled: boolean;
	    preset: string;
	    packets: string;
	    length: string;
	    interval: string;
	    maxSplit: string;
	    noises: NoiseSettings[];
	    direct: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FragmentSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.preset = source["preset"];
	        this.packets = source["packets"];
	        this.length = source["length"];
	        this.interval = source["interval"];
	        this.maxSplit = source["maxSplit"];
	        this.noises = this.convertValues(source["noises"], NoiseSettings);
	        this.direct = source["direct"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CoreSettings {
	    fragment: FragmentSettings;
	    mux: MuxSettings;
	
	    static createFrom(source: any = {}) {
	        return new CoreSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fragment = this.convertValues(source["fragment"], FragmentSettings);
	        this.mux = this.convertValues(source["mux"], MuxSettings);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CustomTheme {
	    id: string;
	    name: string;
	    color: string;
	    base: string;
	    tint: number;
	    surfaceHue?: number;
	    depth: number;
	
	    static createFrom(source: any = {}) {
	        return new CustomTheme(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.base = source["base"];
	        this.tint = source["tint"];
	        this.surfaceHue = source["surfaceHue"];
	        this.depth = source["depth"];
	    }
	}
	export class DNSHost {
	    domain: string;
	    address: string[];
	
	    static createFrom(source: any = {}) {
	        return new DNSHost(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domain = source["domain"];
	        this.address = source["address"];
	    }
	}
	export class DNSRule {
	    domains: string[];
	    server: string;
	    direct: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DNSRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.domains = source["domains"];
	        this.server = source["server"];
	        this.direct = source["direct"];
	    }
	}
	export class DNSServer {
	    address: string;
	    direct: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DNSServer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.address = source["address"];
	        this.direct = source["direct"];
	    }
	}
	export class DNSSettings {
	    servers: DNSServer[];
	    rules: DNSRule[];
	    hosts: DNSHost[];
	    serveStale: boolean;
	    disableCache: boolean;
	    parallelQuery: boolean;
	    systemHosts: boolean;
	    useProfileDns: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DNSSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.servers = this.convertValues(source["servers"], DNSServer);
	        this.rules = this.convertValues(source["rules"], DNSRule);
	        this.hosts = this.convertValues(source["hosts"], DNSHost);
	        this.serveStale = source["serveStale"];
	        this.disableCache = source["disableCache"];
	        this.parallelQuery = source["parallelQuery"];
	        this.systemHosts = source["systemHosts"];
	        this.useProfileDns = source["useProfileDns"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

export namespace types {
	
	export class APIResponse__beam_app_internal_presentation_wails_dto_ProfileData_ {
	    success: boolean;
	    data?: dto.ProfileData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse__beam_app_internal_presentation_wails_dto_ProfileData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ProfileData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeConfig {
	    nodeId: string;
	    name: string;
	    baseName: string;
	    type: string;
	    outbound: Record<string, any>;
	    original: Record<string, any>;
	    overrides: Record<string, any>;
	    isEdited: boolean;
	    isPinned: boolean;
	    hasSubscription: boolean;
	    rawLinkStale: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NodeConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodeId = source["nodeId"];
	        this.name = source["name"];
	        this.baseName = source["baseName"];
	        this.type = source["type"];
	        this.outbound = source["outbound"];
	        this.original = source["original"];
	        this.overrides = source["overrides"];
	        this.isEdited = source["isEdited"];
	        this.isPinned = source["isPinned"];
	        this.hasSubscription = source["hasSubscription"];
	        this.rawLinkStale = source["rawLinkStale"];
	    }
	}
	export class APIResponse__beam_bridge_core_types_NodeConfig_ {
	    success: boolean;
	    data?: NodeConfig;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse__beam_bridge_core_types_NodeConfig_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], NodeConfig);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeInfo {
	    id: string;
	    name: string;
	    type: string;
	    categoryId: string;
	    isSelected: boolean;
	    isEdited?: boolean;
	    isPinned?: boolean;
	    transport?: string;
	    security?: string;
	    description?: string;
	    badge?: string;
	    hideProtocol?: boolean;
	    insecure?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NodeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.categoryId = source["categoryId"];
	        this.isSelected = source["isSelected"];
	        this.isEdited = source["isEdited"];
	        this.isPinned = source["isPinned"];
	        this.transport = source["transport"];
	        this.security = source["security"];
	        this.description = source["description"];
	        this.badge = source["badge"];
	        this.hideProtocol = source["hideProtocol"];
	        this.insecure = source["insecure"];
	    }
	}
	export class Category {
	    id: string;
	    name: string;
	    icon?: string;
	    order: number;
	    emoji?: string;
	    collapsed?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.order = source["order"];
	        this.emoji = source["emoji"];
	        this.collapsed = source["collapsed"];
	    }
	}
	export class CategoryWithNodes {
	    category: Category;
	    nodes: NodeInfo[];
	
	    static createFrom(source: any = {}) {
	        return new CategoryWithNodes(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = this.convertValues(source["category"], Category);
	        this.nodes = this.convertValues(source["nodes"], NodeInfo);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProfileNodesResponse {
	    categories: CategoryWithNodes[];
	    selectedId: string;
	    totalNodes: number;
	
	    static createFrom(source: any = {}) {
	        return new ProfileNodesResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.categories = this.convertValues(source["categories"], CategoryWithNodes);
	        this.selectedId = source["selectedId"];
	        this.totalNodes = source["totalNodes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse__beam_bridge_core_types_ProfileNodesResponse_ {
	    success: boolean;
	    data?: ProfileNodesResponse;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse__beam_bridge_core_types_ProfileNodesResponse_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ProfileNodesResponse);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___beam_app_internal_presentation_wails_dto_CustomFontData_ {
	    success: boolean;
	    data: dto.CustomFontData[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_app_internal_presentation_wails_dto_CustomFontData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.CustomFontData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___beam_app_internal_presentation_wails_dto_SplitTunnelConflictData_ {
	    success: boolean;
	    data: dto.SplitTunnelConflictData[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_app_internal_presentation_wails_dto_SplitTunnelConflictData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.SplitTunnelConflictData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___beam_bridge_core_domain_settings_CustomTheme_ {
	    success: boolean;
	    data: settings.CustomTheme[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_domain_settings_CustomTheme_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], settings.CustomTheme);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___beam_bridge_core_profile_PingResult_ {
	    success: boolean;
	    data: profile.PingResult[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_profile_PingResult_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], profile.PingResult);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ActiveConnection {
	    id: string;
	    network: string;
	    host: string;
	    destination: string;
	    source: string;
	    outbound: string;
	    chains: string[];
	    rule: string;
	    process: string;
	    upload: number;
	    download: number;
	    startedAt: number;
	    duration: number;
	    processPath: string;
	    domain: string;
	    protocol: string;
	    route: string;
	    ruleKind: string;
	    nodeName: string;
	    closed: boolean;
	    endedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new ActiveConnection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.network = source["network"];
	        this.host = source["host"];
	        this.destination = source["destination"];
	        this.source = source["source"];
	        this.outbound = source["outbound"];
	        this.chains = source["chains"];
	        this.rule = source["rule"];
	        this.process = source["process"];
	        this.upload = source["upload"];
	        this.download = source["download"];
	        this.startedAt = source["startedAt"];
	        this.duration = source["duration"];
	        this.processPath = source["processPath"];
	        this.domain = source["domain"];
	        this.protocol = source["protocol"];
	        this.route = source["route"];
	        this.ruleKind = source["ruleKind"];
	        this.nodeName = source["nodeName"];
	        this.closed = source["closed"];
	        this.endedAt = source["endedAt"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_ActiveConnection_ {
	    success: boolean;
	    data: ActiveConnection[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_ActiveConnection_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ActiveConnection);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExportedLink {
	    name: string;
	    link: string;
	
	    static createFrom(source: any = {}) {
	        return new ExportedLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.link = source["link"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_ExportedLink_ {
	    success: boolean;
	    data: ExportedLink[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_ExportedLink_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ExportedLink);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LogEntry {
	    id: number;
	    timestamp: number;
	    level: string;
	    message: string;
	    source?: string;
	
	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = source["timestamp"];
	        this.level = source["level"];
	        this.message = source["message"];
	        this.source = source["source"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_LogEntry_ {
	    success: boolean;
	    data: LogEntry[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_LogEntry_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], LogEntry);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunConflict {
	    nodes: string[];
	    targets: string[];
	    values: string[];
	    identical: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ProTunConflict(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = source["nodes"];
	        this.targets = source["targets"];
	        this.values = source["values"];
	        this.identical = source["identical"];
	        this.message = source["message"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_ProTunConflict_ {
	    success: boolean;
	    data: ProTunConflict[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_ProTunConflict_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ProTunConflict);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunRuleInfo {
	    nodeId: string;
	    nodeKind: string;
	    rank: number;
	    label: string;
	    destId: string;
	    destKind: string;
	    overrides: string[];
	    shadowedBy?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProTunRuleInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodeId = source["nodeId"];
	        this.nodeKind = source["nodeKind"];
	        this.rank = source["rank"];
	        this.label = source["label"];
	        this.destId = source["destId"];
	        this.destKind = source["destKind"];
	        this.overrides = source["overrides"];
	        this.shadowedBy = source["shadowedBy"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_ProTunRuleInfo_ {
	    success: boolean;
	    data: ProTunRuleInfo[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_ProTunRuleInfo_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ProTunRuleInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProviderMux {
	    concurrency?: number;
	    xudpConcurrency?: number;
	    xudpProxyUDP443?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderMux(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.concurrency = source["concurrency"];
	        this.xudpConcurrency = source["xudpConcurrency"];
	        this.xudpProxyUDP443 = source["xudpProxyUDP443"];
	    }
	}
	export class ProviderNoise {
	    type: string;
	    packet: string;
	    delay?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderNoise(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.packet = source["packet"];
	        this.delay = source["delay"];
	    }
	}
	export class ProviderFragment {
	    packets?: string;
	    length?: string;
	    interval?: string;
	    maxSplit?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderFragment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.packets = source["packets"];
	        this.length = source["length"];
	        this.interval = source["interval"];
	        this.maxSplit = source["maxSplit"];
	    }
	}
	export class ProviderSettings {
	    fragment?: ProviderFragment;
	    noises?: ProviderNoise[];
	    mux?: ProviderMux;
	    profileDns?: boolean;
	    newUrl?: string;
	    fallbackUrl?: string;
	    description?: string;
	    supportEmail?: string;
	    hideTraffic?: boolean;
	    hideSettings?: boolean;
	    pin?: boolean;
	    pingOnOpen?: boolean;
	    autoUpdate?: boolean;
	    autoUpdateOnOpen?: boolean;
	    autoConnect?: boolean;
	    autoConnectType?: string;
	    pingType?: string;
	    pingUrl?: string;
	    sortOrder?: string;
	    sniffing?: boolean;
	    excludeRoutes?: string[];
	    perAppMode?: string;
	    perAppList?: string[];
	    perAppInvert?: boolean;
	    routingUrl?: string;
	    extra?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ProviderSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fragment = this.convertValues(source["fragment"], ProviderFragment);
	        this.noises = this.convertValues(source["noises"], ProviderNoise);
	        this.mux = this.convertValues(source["mux"], ProviderMux);
	        this.profileDns = source["profileDns"];
	        this.newUrl = source["newUrl"];
	        this.fallbackUrl = source["fallbackUrl"];
	        this.description = source["description"];
	        this.supportEmail = source["supportEmail"];
	        this.hideTraffic = source["hideTraffic"];
	        this.hideSettings = source["hideSettings"];
	        this.pin = source["pin"];
	        this.pingOnOpen = source["pingOnOpen"];
	        this.autoUpdate = source["autoUpdate"];
	        this.autoUpdateOnOpen = source["autoUpdateOnOpen"];
	        this.autoConnect = source["autoConnect"];
	        this.autoConnectType = source["autoConnectType"];
	        this.pingType = source["pingType"];
	        this.pingUrl = source["pingUrl"];
	        this.sortOrder = source["sortOrder"];
	        this.sniffing = source["sniffing"];
	        this.excludeRoutes = source["excludeRoutes"];
	        this.perAppMode = source["perAppMode"];
	        this.perAppList = source["perAppList"];
	        this.perAppInvert = source["perAppInvert"];
	        this.routingUrl = source["routingUrl"];
	        this.extra = source["extra"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Branding {
	    iconUrl?: string;
	    bannerText?: string;
	    bannerUrl?: string;
	    bannerColor?: string;
	    bannerImage?: string;
	    webPageUrl?: string;
	    supportUrl?: string;
	    communityUrl?: string;
	
	    static createFrom(source: any = {}) {
	        return new Branding(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.iconUrl = source["iconUrl"];
	        this.bannerText = source["bannerText"];
	        this.bannerUrl = source["bannerUrl"];
	        this.bannerColor = source["bannerColor"];
	        this.bannerImage = source["bannerImage"];
	        this.webPageUrl = source["webPageUrl"];
	        this.supportUrl = source["supportUrl"];
	        this.communityUrl = source["communityUrl"];
	    }
	}
	export class ProfileSummary {
	    id: string;
	    name: string;
	    provider: string;
	    announce?: string;
	    supportUrl?: string;
	    iconUrl?: string;
	    communityUrl?: string;
	    branding?: Branding;
	    proTunLocked?: boolean;
	    hideProvider?: boolean;
	    providerSettings?: ProviderSettings;
	    dataLimit: number;
	    dataUsed: number;
	    daysLeft: number;
	    isExpired?: boolean;
	    usedPercent: number;
	    isActive: boolean;
	    hasSubscription: boolean;
	    url?: string;
	    updateIntervalHours?: number;
	    autoRefreshDisabled?: boolean;
	    updateIntervalOverrideHours?: number;
	
	    static createFrom(source: any = {}) {
	        return new ProfileSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.provider = source["provider"];
	        this.announce = source["announce"];
	        this.supportUrl = source["supportUrl"];
	        this.iconUrl = source["iconUrl"];
	        this.communityUrl = source["communityUrl"];
	        this.branding = this.convertValues(source["branding"], Branding);
	        this.proTunLocked = source["proTunLocked"];
	        this.hideProvider = source["hideProvider"];
	        this.providerSettings = this.convertValues(source["providerSettings"], ProviderSettings);
	        this.dataLimit = source["dataLimit"];
	        this.dataUsed = source["dataUsed"];
	        this.daysLeft = source["daysLeft"];
	        this.isExpired = source["isExpired"];
	        this.usedPercent = source["usedPercent"];
	        this.isActive = source["isActive"];
	        this.hasSubscription = source["hasSubscription"];
	        this.url = source["url"];
	        this.updateIntervalHours = source["updateIntervalHours"];
	        this.autoRefreshDisabled = source["autoRefreshDisabled"];
	        this.updateIntervalOverrideHours = source["updateIntervalOverrideHours"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___beam_bridge_core_types_ProfileSummary_ {
	    success: boolean;
	    data: ProfileSummary[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_ProfileSummary_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ProfileSummary);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RunningApplication {
	    name: string;
	    path?: string;
	    icon?: string;
	
	    static createFrom(source: any = {}) {
	        return new RunningApplication(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.icon = source["icon"];
	    }
	}
	export class APIResponse___beam_bridge_core_types_RunningApplication_ {
	    success: boolean;
	    data: RunningApplication[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___beam_bridge_core_types_RunningApplication_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], RunningApplication);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse___string_ {
	    success: boolean;
	    data: string[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse___string_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = source["data"];
	        this.error = source["error"];
	    }
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_AppearanceDetailsData_ {
	    success: boolean;
	    data: dto.AppearanceDetailsData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_AppearanceDetailsData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.AppearanceDetailsData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_ApplicationSettingsData_ {
	    success: boolean;
	    data: dto.ApplicationSettingsData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_ApplicationSettingsData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ApplicationSettingsData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_ConnectionSettingsData_ {
	    success: boolean;
	    data: dto.ConnectionSettingsData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_ConnectionSettingsData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ConnectionSettingsData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_CustomFontData_ {
	    success: boolean;
	    data: dto.CustomFontData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_CustomFontData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.CustomFontData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_HwidSettingsData_ {
	    success: boolean;
	    data: dto.HwidSettingsData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_HwidSettingsData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.HwidSettingsData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_PingSettingsData_ {
	    success: boolean;
	    data: dto.PingSettingsData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_PingSettingsData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.PingSettingsData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_ProTunLayerData_ {
	    success: boolean;
	    data: dto.ProTunLayerData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_ProTunLayerData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ProTunLayerData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_ProTunScopesData_ {
	    success: boolean;
	    data: dto.ProTunScopesData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_ProTunScopesData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ProTunScopesData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_ProTunStateData_ {
	    success: boolean;
	    data: dto.ProTunStateData;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_ProTunStateData_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.ProTunStateData);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_app_internal_presentation_wails_dto_WallpaperInfo_ {
	    success: boolean;
	    data: dto.WallpaperInfo;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_app_internal_presentation_wails_dto_WallpaperInfo_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], dto.WallpaperInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_analytics_Report_ {
	    success: boolean;
	    data: analytics.Report;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_analytics_Report_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], analytics.Report);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_domain_settings_BackdropSettings_ {
	    success: boolean;
	    data: settings.BackdropSettings;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_domain_settings_BackdropSettings_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], settings.BackdropSettings);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_domain_settings_CoreSettings_ {
	    success: boolean;
	    data: settings.CoreSettings;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_domain_settings_CoreSettings_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], settings.CoreSettings);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_domain_settings_CustomTheme_ {
	    success: boolean;
	    data: settings.CustomTheme;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_domain_settings_CustomTheme_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], settings.CustomTheme);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_domain_settings_DNSSettings_ {
	    success: boolean;
	    data: settings.DNSSettings;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_domain_settings_DNSSettings_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], settings.DNSSettings);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BuildInfo {
	    version: string;
	    variant: string;
	    buildHash: string;
	    isDev: boolean;
	    betaTag: string;
	    os: string;
	
	    static createFrom(source: any = {}) {
	        return new BuildInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.variant = source["variant"];
	        this.buildHash = source["buildHash"];
	        this.isDev = source["isDev"];
	        this.betaTag = source["betaTag"];
	        this.os = source["os"];
	    }
	}
	export class APIResponse_beam_bridge_core_types_BuildInfo_ {
	    success: boolean;
	    data: BuildInfo;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_types_BuildInfo_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], BuildInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunViewport {
	    x: number;
	    y: number;
	    zoom: number;
	
	    static createFrom(source: any = {}) {
	        return new ProTunViewport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	        this.zoom = source["zoom"];
	    }
	}
	export class ProTunEdge {
	    id: string;
	    source: string;
	    target: string;
	
	    static createFrom(source: any = {}) {
	        return new ProTunEdge(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.source = source["source"];
	        this.target = source["target"];
	    }
	}
	export class ProTunServerRef {
	    profileId: string;
	    nodeId: string;
	    name?: string;
	    profileName?: string;
	    via?: ProTunServerRef;
	
	    static createFrom(source: any = {}) {
	        return new ProTunServerRef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.profileId = source["profileId"];
	        this.nodeId = source["nodeId"];
	        this.name = source["name"];
	        this.profileName = source["profileName"];
	        this.via = this.convertValues(source["via"], ProTunServerRef);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunSize {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new ProTunSize(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class ProTunPosition {
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new ProTunPosition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class ProTunNode {
	    id: string;
	    kind: string;
	    position: ProTunPosition;
	    label?: string;
	    items?: string[];
	    text?: string;
	    size?: ProTunSize;
	    op?: string;
	    server?: ProTunServerRef;
	    invert?: boolean;
	    except?: string[];
	
	    static createFrom(source: any = {}) {
	        return new ProTunNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.kind = source["kind"];
	        this.position = this.convertValues(source["position"], ProTunPosition);
	        this.label = source["label"];
	        this.items = source["items"];
	        this.text = source["text"];
	        this.size = this.convertValues(source["size"], ProTunSize);
	        this.op = source["op"];
	        this.server = this.convertValues(source["server"], ProTunServerRef);
	        this.invert = source["invert"];
	        this.except = source["except"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProTunGraph {
	    nodes: ProTunNode[];
	    edges: ProTunEdge[];
	    viewport?: ProTunViewport;
	
	    static createFrom(source: any = {}) {
	        return new ProTunGraph(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nodes = this.convertValues(source["nodes"], ProTunNode);
	        this.edges = this.convertValues(source["edges"], ProTunEdge);
	        this.viewport = this.convertValues(source["viewport"], ProTunViewport);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_types_ProTunGraph_ {
	    success: boolean;
	    data: ProTunGraph;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_types_ProTunGraph_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], ProTunGraph);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SplitTunnelSettings {
	    enabled: boolean;
	    mode: string;
	    apps: string[];
	    domains: string[];
	    ips: string[];
	
	    static createFrom(source: any = {}) {
	        return new SplitTunnelSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.mode = source["mode"];
	        this.apps = source["apps"];
	        this.domains = source["domains"];
	        this.ips = source["ips"];
	    }
	}
	export class APIResponse_beam_bridge_core_types_SplitTunnelSettings_ {
	    success: boolean;
	    data: SplitTunnelSettings;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_types_SplitTunnelSettings_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], SplitTunnelSettings);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateFileEntry {
	    path: string;
	    urls: string[];
	    sha256: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new UpdateFileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.urls = source["urls"];
	        this.sha256 = source["sha256"];
	        this.size = source["size"];
	    }
	}
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion?: string;
	    mandatory?: boolean;
	    releasedAt?: string;
	    notes?: string[];
	    files?: UpdateFileEntry[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.mandatory = source["mandatory"];
	        this.releasedAt = source["releasedAt"];
	        this.notes = source["notes"];
	        this.files = this.convertValues(source["files"], UpdateFileEntry);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_beam_bridge_core_types_UpdateInfo_ {
	    success: boolean;
	    data: UpdateInfo;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_beam_bridge_core_types_UpdateInfo_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = this.convertValues(source["data"], UpdateInfo);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class APIResponse_bool_ {
	    success: boolean;
	    data: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_bool_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = source["data"];
	        this.error = source["error"];
	    }
	}
	export class APIResponse_int_ {
	    success: boolean;
	    data: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_int_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = source["data"];
	        this.error = source["error"];
	    }
	}
	export class APIResponse_map_string_string_ {
	    success: boolean;
	    data: Record<string, string>;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_map_string_string_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = source["data"];
	        this.error = source["error"];
	    }
	}
	export class APIResponse_string_ {
	    success: boolean;
	    data: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new APIResponse_string_(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.data = source["data"];
	        this.error = source["error"];
	    }
	}
	
	
	
	
	
	export class ConnectionStats {
	    ping: number;
	    bytesReceived: number;
	    bytesSent: number;
	    connectedAt: number;
	    duration: number;
	    isHealthy: boolean;
	    activeConns: number;
	    lastActivityAt: number;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ping = source["ping"];
	        this.bytesReceived = source["bytesReceived"];
	        this.bytesSent = source["bytesSent"];
	        this.connectedAt = source["connectedAt"];
	        this.duration = source["duration"];
	        this.isHealthy = source["isHealthy"];
	        this.activeConns = source["activeConns"];
	        this.lastActivityAt = source["lastActivityAt"];
	    }
	}
	
	export class KillSwitchState {
	    supported: boolean;
	    enabled: boolean;
	    engaged: boolean;
	    reason?: string;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new KillSwitchState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.supported = source["supported"];
	        this.enabled = source["enabled"];
	        this.engaged = source["engaged"];
	        this.reason = source["reason"];
	        this.error = source["error"];
	    }
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

}

