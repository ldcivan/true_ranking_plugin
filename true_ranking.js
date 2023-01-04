import plugin from '../../lib/plugins/plugin.js'
import { segment } from "oicq";
import { createRequire } from "module";
//const require_ = createRequire(import.meta.url);

//const axios = require_('axios');

var md_id = "" //

const allScore = []
let totalCount = {
    short: 0,
    long: 0,
}
let render = null

var offical_title = ""
var offical_score = 0
var offical_count = 0

export class example extends plugin {
    constructor() {
        super({
            name: 'true_score',
            event: 'message',
            priority: 5000,
            rule: [
                {
                  reg: "^#?番剧评分帮助$",
                  fnc: 'b_socre_help'
                },
                {
                    reg: '^#?番剧评分.*$',
                    fnc: 'b_socre'
                }
            ]
        })
    }

    
    async b_socre(e) {
        //beforeRender()
        md_id = e.msg.replace(/#| |番剧评分| /g, "")
        
        const reg = /^[0-9]+.?[0-9]*$/
        
        if (md_id==""||!reg.test(md_id)){
            this.reply("id应该为纯数字！")
            this.reply(md_id)
            return
        }
        
        await this.baseInfo(md_id)
        console.log("--统计短评");
        e.reply("统计短评中")
        await this.scoreMain('short', e, md_id)
        console.log("--统计长评");
        e.reply("统计长评中")
        await this.scoreMain('long', e, md_id)
        this.average(e)
        //rmDialog()
    }
    
    async baseInfo(md_id){
        let baseinfo_url = `https://api.bilibili.com/pgc/review/user?media_id=${md_id}`
        const baseinfo_res = await fetch(baseinfo_url, { "method": "GET" });
        var baseinfo  = await baseinfo_res.json()
        //this.reply(JSON.stringify(baseinfo.result.media.title))
        offical_title = JSON.stringify(baseinfo.result.media.title)
        offical_score = JSON.stringify(baseinfo.result.media.rating.score)
        offical_count = JSON.stringify(baseinfo.result.media.rating.count)
    }
    
    async getScore(next, type, e, md_id) {
    
        //var local_url = window.location.href;
        
        //var md_id = local_url.match(/media\/md(\S*)\/\?/)[1];
        
        
    
        let url = `https://api.bilibili.com/pgc/review/${type}/list?media_id=${md_id}`
    
        if (next) {
            url += `&cursor=${next}`
        }
        const res = await fetch(url, { "method": "GET" });
        const { data } = await res.json()
        if (totalCount[type] == 0) {
            totalCount[type] = data.total
        }
        return data
    }
    
    async scoreMain(type, e) {
        let { list, next } = await this.getScore(undefined, type, e, md_id)
        this.handlerList(list)
    
        while (true) {
            const data = await this.getScore(next, type, e, md_id)
            this.handlerList(data.list)
            //render(type)
            next = data.next
            if (next == 0) {
                return
            }
        }
    }
    async average(e) {
        const total = allScore.reduce((p, v) => {
            return p + v
        }, 0)
        const s = total / allScore.length
        const sf = s.toFixed(1)
        console.log('平均分:', sf)
        this.reply(`番剧名：${offical_title}\n真实平均分：${sf}\n基于${allScore.length}个评价（含长短评）\n----------\n官方平均分：${offical_score}\n基于${offical_count}个评价（含长短评）`)
    }
    async handlerList(list) {
        allScore.push(...list.map(item => item.score))
    }
    
    //main()
    
  async b_socre_help(e){
      await e.reply("回复“#番剧评分”+番剧mdID即可查看番剧真实评分")
  }
}