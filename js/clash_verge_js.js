// Define the `main` function

function main(params) {
    console.log("('*********************开始执行脚本****************************')");
    if (params.dns) {
        params.dns.enable = false;
        params.dns.enabled = false;
    }
  
    const proxies = params['proxies'];
    const group = params['proxy-groups'];
  
    /**
     * 开始插入额外的 proxies
     */
    // 私有节点不要提交到公开仓库；需要时在本地未跟踪版本中维护。
    let proxiesArr = [];
  
    if (proxies.findIndex((e) => e.name.indexOf('Oracle') > -1 || e.name.indexOf('自建') > -1 || e.name.indexOf('FYW') > -1) > -1) {
        proxiesArr = [];
    }
  
    for (let i = 0; i < proxiesArr.length; i++) {
        const temp_proxy = proxiesArr[i];
        proxies.push(temp_proxy);
    }
  
    //
  
    /**
     * 插入节点完成
     */
  
    /**
     * 开始插入规则
     */
    // 定义规则用的代理组
    const myGroup = ['极速云', 'Proxy', '节点选择', '🚀 节点选择', '顶级机场'];
    /**
     * 额外添加的规则
     */
    const newRules = [
        'DOMAIN-SUFFIX,notion.so',
        'DOMAIN-SUFFIX,masuit.com',
        'DOMAIN-SUFFIX,updates.cdn-apple.com',
        'DOMAIN-SUFFIX,microsoft.com',
        'DOMAIN-SUFFIX,microsoft.net',
        'DOMAIN-SUFFIX,office.com',
        'DOMAIN-SUFFIX,office.net',
        'DOMAIN-SUFFIX,bing.com',
        'DOMAIN-SUFFIX,google.com',
        'DOMAIN-SUFFIX,icloud.com.cn',
        'DOMAIN-SUFFIX,icloud-content.com.cn',
    ];
    const rules = params.rules;
  
    for (let i = 0; i < myGroup.length; i++) {
        const match_group = group.find((e) => e.name == myGroup[i] || e.name.indexOf(myGroup[i]) > -1);
        if (match_group) {
            params.rules = newRules.map((e) => `${e},${match_group.name}`).concat(params.rules);
            break;
        }
    }
  
    /**
     * 插入规则完成
     */
  
    // 自定义代理组
    const MY = {
        name: 'MY',
        type: 'select',
        proxies: [],
    };
  
    const JP = {
        name: 'JP-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const USA = {
        name: 'USA-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const TW = {
        name: 'TW-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const HK = {
        name: 'HK-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const SR = {
        name: 'SR-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const KR = {
        name: 'KR-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const OTHER = {
        name: 'OTHER-top',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        tolerance: 20,
        lazy: true,
        proxies: [],
    };
    const my111 = [JP, USA, TW, HK, SR, KR, OTHER];
  
    for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        if (checkArea(proxy.name, 'JP')) {
            JP.proxies.push(proxy.name);
        } else if (checkArea(proxy.name, 'USA')) {
            USA.proxies.push(proxy.name);
        } else if (checkArea(proxy.name, 'HK')) {
            HK.proxies.push(proxy.name);
        } else if (checkArea(proxy.name, 'TW')) {
            TW.proxies.push(proxy.name);
        } else if (checkArea(proxy.name, 'SR')) {
            SR.proxies.push(proxy.name);
        } else if (checkArea(proxy.name, 'KR')) {
            KR.proxies.push(proxy.name);
        } else {
            OTHER.proxies.push(proxy.name);
        }
    }
    for (let i = 0; i < my111.length; i++) {
        const temp = my111[i];
        if (temp.proxies.length > 0) {
            params['proxy-groups'].push(temp);
            MY.proxies.push(temp.name);
        }
    }
  
    for (let i = 0; i < proxiesArr.length; i++) {
        MY.proxies.push(proxiesArr[i].name);
    }
  
    if (MY.proxies.length > 0) {
        params['proxy-groups'].unshift(MY);
  
        const main_group = params['proxy-groups'].find((e) => myGroup.find((m) => m == e.name || e.name.indexOf(m) > -1));
        if (main_group) {
            main_group.proxies.push('MY');
        }
    }
  
    // 加入select代理组
  
    // 自定义代理组
  
    // 测试用
    // const MY = {
    //     name: 'MY',
    //     type: 'url-test',
    //     url: 'http://www.gstatic.com/generate_204',
    //     interval: 300,
    //     tolerance: 20,
    //     lazy: true,
    //     proxies: ['oracle-138-ssr', 'oracle-152'],
    // };
  
    // params['proxy-groups'].push(MY);
  
    return JSON.parse(JSON.stringify(params));
  }
  
  const AREA = {
    JP: ['jp', 'JP', '日本', 'Japan', '🇯🇵', 'oracle', 'Oracle'],
    USA: ['usa', 'us', 'USA', 'US', '美国', 'United States', '🇺🇸'],
    SR: ['sr', 'SR', '新加坡', 'Singapore', '🇸🇬'],
    HK: ['hk', 'HK', '香港', 'Hong Kong', '🇭🇰'],
    TW: ['tw', 'TW', '台湾', 'Taiwan', '🇨🇳'],
    KR: ['kr', 'KR', '韩国'],
  };
  
  function checkArea(name, key) {
    let flag = false;
    const area = AREA[key];
    if (area) {
        for (let i = 0; i < area.length; i++) {
            if (name.indexOf(area[i]) > -1) {
                flag = true;
                break;
            }
        }
    }
    return flag;
  }
  
