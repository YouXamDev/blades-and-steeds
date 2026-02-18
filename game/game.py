import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# 引入 Pillow 库
try:
    from PIL import Image as PILImage, ImageColor
except ImportError:
    print("错误: 请先安装 Pillow 库。运行: pip install Pillow")
    exit()

def create_pdf(filename):
    doc = SimpleDocTemplate(filename, pagesize=A4, 
                            rightMargin=20, leftMargin=20, 
                            topMargin=20, bottomMargin=20)
    story = []
    
    # --- 1. 字体配置 ---
    font_path = "SimHei.ttf" 
    possible_paths = [
        "C:\\Windows\\Fonts\\simhei.ttf",            
        "C:\\Windows\\Fonts\\msyh.ttf",              
        "/System/Library/Fonts/STHeiti Light.ttc",   
        "/System/Library/Fonts/PingFang.ttc",        
        "/usr/share/fonts/truetype/arphic/uming.ttc", 
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
    ]

    for path in possible_paths:
        if os.path.exists(path):
            font_path = path
            break
            
    try:
        pdfmetrics.registerFont(TTFont('ChineseFont', font_path))
        print(f"使用字体: {font_path}")
    except:
        print("字体加载失败，请确保系统中有中文字体。")

    # --- 2. 样式定义 ---
    styles = getSampleStyleSheet()
    normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontName='ChineseFont', fontSize=10, leading=14)
    cell_style = ParagraphStyle('TableCell', parent=normal_style, fontSize=9, leading=13, alignment=TA_LEFT)
    title_style = ParagraphStyle('TitleStyle', parent=styles['Title'], fontName='ChineseFont', fontSize=24, spaceAfter=15, alignment=TA_CENTER)
    h1_style = ParagraphStyle('Header1', parent=styles['Heading1'], fontName='ChineseFont', fontSize=15, spaceBefore=10, spaceAfter=5, textColor=colors.darkblue)
    h2_style = ParagraphStyle('Header2', parent=styles['Heading2'], fontName='ChineseFont', fontSize=11, spaceBefore=5, spaceAfter=2, textColor=colors.black)
    header_white = ParagraphStyle('HeaderWhite', parent=normal_style, fontSize=10, textColor=colors.white, fontName='ChineseFont', alignment=TA_CENTER)
    class_name_style = ParagraphStyle('ClassName', parent=normal_style, fontSize=10, textColor=colors.black, fontName='ChineseFont', alignment=TA_CENTER)

    # 辅助函数
    def P(text, style=normal_style): return Paragraph(text, style)
    def Cell(text): return Paragraph(text, cell_style)
    def Head(text): return Paragraph(f"<b>{text}</b>", header_white)
    def ClassName(text): return Paragraph(f"<b>{text}</b>", class_name_style)

    # --- 3. 图像处理核心函数 ---
    def RecolorIcon(image_path, color_hex, width=10, height=10):
        if not os.path.exists(image_path):
            return "" 
        
        try:
            img = PILImage.open(image_path).convert("RGBA")
            gray = img.convert("L")
            target_rgb = ImageColor.getrgb(color_hex)
            
            gray_data = gray.getdata()
            new_data = []
            tr, tg, tb = target_rgb
            
            for pixel_val in gray_data:
                nr = int((pixel_val / 255.0) * tr)
                ng = int((pixel_val / 255.0) * tg)
                nb = int((pixel_val / 255.0) * tb)
                new_data.append((nr, ng, nb))
            
            colored_img = PILImage.new("RGB", img.size)
            colored_img.putdata(new_data)
            
            final_img = PILImage.merge("RGBA", (*colored_img.split(), img.split()[3]))

            temp_name = f"temp_{color_hex[1:]}_{os.path.basename(image_path)}"
            final_img.save(temp_name, format="PNG")
            
            return f'<img src="{temp_name}" width="{width}" height="{height}" valign="-2"/>'
            
        except Exception as e:
            print(f"染色失败 {image_path}: {e}")
            return f'<img src="{image_path}" width="{width}" height="{height}" valign="-2"/>'

    # 普通行内图标
    def InlineIcon(image_name, size=10):
        if os.path.exists(image_name):
            return f'<img src="{image_name}" width="{size}" height="{size}" valign="-2"/>' 
        return ""
    
    # 块级图标
    def GetBlockIcon(image_name, width=15, height=15):
        if os.path.exists(image_name):
            return Image(image_name, width=width*mm, height=height*mm)
        return Spacer(width*mm, height*mm)

    # --- 4. 文档构建 ---

    story.append(P("《买刀买马》 游戏设计文档", title_style))

    # 第一章
    story.append(P("1. 基础规则", h1_style))
    story.append(P("<b>1.1 游戏综述</b>", h2_style))
    story.append(P("- <b>人数：</b> 2 ~ 9 人。", normal_style))
    story.append(P("- <b>获胜：</b> 存活到最后的一人获胜（特殊：爆破手同归于尽判胜）。", normal_style))
    story.append(P("- <b>开局流程：</b> 每局开始前，系统随机分发 2 个不同的职业给每位玩家，玩家 <b>二选一</b> 决定本局角色。", normal_style))

    story.append(P("<b>1.2 角色与地图</b>", h2_style))
    
    i_shirt = InlineIcon("icon_shirt.png", 12)
    i_knife = InlineIcon("icon_knife.png", 12)
    i_horse = InlineIcon("icon_horse.png", 12)
    
    story.append(P("- <b>属性：</b> 血量 10 点。物品栏公开透明。", normal_style))
    story.append(P(f"- <b>初始装备：</b> {i_shirt} 衣服 x1 &nbsp;&nbsp; {i_knife} 买刀权 x1 &nbsp;&nbsp; {i_horse} 买马权 x1", normal_style))
    story.append(P("- <b>地图：</b> 玩家位于【城池】或【中央】。城池仅通往中央。", normal_style))

    # 第二章
    story.append(P("2. 回合与行动", h1_style))
    story.append(P("<b>2.1 步数与行动</b>", h2_style))
    story.append(P("每回合步数 = 基础步数(1) + 随机分配步数（总池=存活人数）。", normal_style))

    act_data = [
        [Head("行动"), Head("消耗"), Head("详细规则")],
        [Cell("移动"), Cell("1步"), Cell("在【所在城池】与【中央】之间移动一次。")],
        [Cell("购买"), Cell("1步 + 购买权"), Cell("仅限在【自己的城池】内。消耗1步和对应购买权获得物品。")],
        [Cell("抢夺"), Cell("1步"), Cell("需同位置。抢夺对方任意一件实体物品。不可抢夺购买权。")],
        [Cell("攻击-刀"), Cell("1步"), Cell("需同位置。造成伤害。")],
        [Cell("攻击-马"), Cell("1步"), Cell("需同城内（中央不可用）。造成伤害 + 强制将目标踢至中央。")]
    ]
    t1 = Table(act_data, colWidths=[60, 80, 400])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ]))
    story.append(t1)
    
    story.append(P("<b>2.2 物品原则</b>", h2_style))
    story.append(P("- <b>持有 vs 使用：</b> 玩家可抢夺任何物品。若职业不匹配，物品仅占位，无法使用（无数值加成）。", normal_style))
    story.append(P("- <b>遗物处理：</b> 击杀者可选拿走 <b>0件或1件</b> 物品（含购买权），剩余物品<b>全部销毁</b>。", normal_style))
    story.append(P("<b>2.3 结算顺序 (Settlement Order)</b>", h2_style))
    story.append(P("- <b>按释放顺序生效 (FIFO)：</b> 所有延时类技能（如药水、炮弹）严格按照玩家的操作顺序依次结算。", normal_style))

    # 第三章
    story.append(P("3. 战斗数值系统", h1_style))
    story.append(P("<b>最终伤害 = (武器总伤害) - (衣服总数量) + 1</b>", h2_style))
    story.append(P("<i>*注：若计算结果 ≤ 0，则造成 0 点伤害。</i>", normal_style))
    story.append(P(f"- <b>刀 (基础伤1):</b> {InlineIcon('icon_knife.png',10)} 1 + (刀数量 - 1)。", normal_style))
    story.append(P(f"- <b>马 (基础伤3):</b> {InlineIcon('icon_horse.png',10)} 3 + (马数量 - 1)。", normal_style))

    # 第四章
    story.append(P("4. 职业系统详解", h1_style))
    story.append(P("每局同职业限2人。所有职业道具伤害均遵循<b>【数量+1，伤害+1】</b>规则。", normal_style))
    story.append(Spacer(1, 5))

    # --- 职业数据 ---
    i_potion = InlineIcon("icon_potion.png", 10)
    i_bow = InlineIcon("icon_bow.png", 10)
    i_arrow = InlineIcon("icon_arrow.png", 10)
    i_rocket = InlineIcon("icon_rocket.png", 10)
    i_ammo = InlineIcon("icon_ammo.png", 10)
    i_bomb = InlineIcon("icon_bomb.png", 10)
    i_ufo = InlineIcon("icon_ufo.png", 10)
    i_fat = InlineIcon("icon_fat.png", 10)

    # 颜色定义
    C_BRONZE = "#CD7F32" 
    C_SILVER = "#A9A9A9" 
    C_GOLD = "#FFD700"   

    # 染色图标
    glove_bronze = RecolorIcon("icon_glove.png", C_BRONZE, 10)
    glove_silver = RecolorIcon("icon_glove.png", C_SILVER, 10)
    glove_gold = RecolorIcon("icon_glove.png", C_GOLD, 10)

    belt_bronze = RecolorIcon("icon_belt.png", C_BRONZE, 10)
    belt_silver = RecolorIcon("icon_belt.png", C_SILVER, 10)
    belt_gold = RecolorIcon("icon_belt.png", C_GOLD, 10)

    classes_raw = [
        {
            "icon": "icon_potion.png", 
            "name": "① 法师\n(Mage)",
            "buy_text": f"<b>初始：</b> 无特殊。<br/><b>购买：</b> {i_potion} 药水 (X步)",
            "rule": "<b>规则：</b><br/>- <b>限制：</b> 无限买，不占物品栏。<br/>- <b>技能：</b> 延时回血（下回合所有人行动结束后生效）。<br/>- <b>效果：</b> 指定全图任意位置，该位置所有人回复 X 点血量。"
        },
        {
            "icon": "icon_bow.png",  
            "name": "② 弓箭手\n(Archer)",
            "buy_text": f"<b>初始：</b> 买弓权 x1<br/><b>购买：</b><br/>{i_bow} 弓 (2步+权)<br/>{i_arrow} 箭 (1步)",
            "rule": "<b>规则：</b><br/>- <b>射击消耗：</b> 1步 + 1支箭（需持有弓）。<br/>- <b>范围：</b> 当前位置 或 相邻区域。<br/>- <b>伤害：</b> 1 + (弓数量 - 1)。"
        },
        {
            "icon": "icon_rocket.png", 
            "name": "③ 火箭兵\n(Rocketeer)",
            "buy_text": f"<b>初始：</b> 买火箭筒权 x1<br/><b>购买：</b><br/>{i_rocket} 火箭筒 (2步+权)<br/>{i_ammo} 火箭弹 (2步)", 
            "rule": f"<b>规则：</b><br/>- <b>开火消耗：</b> 1步 + 1发火箭弹（需持有火箭筒）。<br/>- <b>范围：</b> 全图任意指定区域（延时AOE，下回合结束生效）。<br/>- <b>伤害：</b> 2 + (火箭筒数量 - 1) 点真实伤害。"
        },
        {
            "icon": "icon_bomb.png", 
            "name": "④ 爆破手\n(Bomber)",
            "buy_text": f"<b>初始：</b> 无<br/><b>购买：</b> {i_bomb} 炸弹 (1步)",
            "rule": "<b>规则：</b><br/>- <b>埋弹消耗：</b> 1步。在脚下放置炸弹（全场可见）。<br/>- <b>引爆消耗：</b> 1步。引爆自己场上所有的炸弹。<br/>- <b>伤害：</b> 真实伤害。",
        },
        {
            "icon": "icon_glove.png", 
            "name": "⑤ 拳击手\n(Boxer)",
            # 标注无衣服、无刀马权
            "buy_text": f"<b>初始：</b> 买拳套权(3种)<br/>(无衣服/无刀马权)<br/><b>购买：</b><br/>{glove_bronze} 铜拳套 (1步)<br/>{glove_silver} 银拳套 (2步)<br/>{glove_gold} 金拳套 (3步)",
            "rule": f"<b>规则：</b><br/>- <b>限制：</b> 无法使用刀/马/衣。<br/>- <b>攻击消耗：</b> 1步。<br/>- <b>伤害公式：</b> 基础值 + (同种数量 - 1)。<br/>- <b>基础值：</b> 铜=1 / 银=2 / 金=3 (真实伤害)。"
        },
        {
            "icon": "icon_belt.png", 
            "name": "⑥ 武僧\n(Monk)",
            # 标注无衣服、无刀马权
            "buy_text": f"<b>初始：</b> 买腰带权(3种)<br/>(无衣服/无刀马权)<br/><b>购买：</b><br/>{belt_bronze} 铜腰带 (1步)<br/>{belt_silver} 银腰带 (2步)<br/>{belt_gold} 金腰带 (3步)",
            "rule": f"<b>规则：</b><br/>- <b>限制：</b> 无法使用刀/马/衣。<br/>- <b>攻击：</b> 1步。真实伤害 + 强制移动1步。<br/>- <b>基础值：</b> 铜=1 / 银=1 / 金=2。<br/>- <b>范围：</b> 铜/金限近身；银带可攻击全图。"
        },
        {
            "icon": "icon_ufo.png", 
            "name": "⑦ 外星人\n(Alien)",
            # 标注无买马权
            "buy_text": f"<b>初始：</b> 买UFO权 x1<br/>(无买马权)<br/><b>购买：</b> {i_ufo} UFO (2步+权)",
            "rule": "<b>规则：</b><br/>- <b>限制：</b> 无法使用马。<br/>- <b>瞬移消耗：</b> 1步。移动到地图上任意位置。<br/>- <b>被动：</b> 拥有2个UFO时，本回合所有人行动结束后免费瞬移一次。"
        },
        {
            "icon": "icon_fat.png", 
            "name": "⑧ 胖子\n(Fatty)",
            # 标注无买马权
            "buy_text": f"<b>初始：</b> 自带 {i_fat}<br/>(无买马权)<br/><b>购买：</b> 无",
            "rule": "<b>规则：</b><br/>- <b>限制：</b> 无法使用马。<br/>- <b>属性：</b> 开局自带【脂肪衣】，不可抢，死后消失。提供防御。<br/>- <b>抱人：</b> 移动时消耗双倍步数，拖拽同位置一人一起移动。"
        },
        {
            "icon": "icon_vampire.png", 
            "name": "⑨ 吸血鬼\n(Vampire)",
            "buy_text": "<b>初始：</b> 无<br/><b>购买：</b> 无",
            "rule": f"<b>被动规则：</b><br/>- <b>吸血：</b> 只有在使用【刀】进行攻击行动时（无论是否造成伤害），自身回复 1 点血量。"
        }
    ]

    c_header = [Head("职业"), Head("购买与初始"), Head("详细伤害与规则")]
    c_data = [c_header]

    for item in classes_raw:
        img_obj = GetBlockIcon(item["icon"], width=18, height=18)
        if isinstance(img_obj, Image):
            cell_icon = [img_obj, Spacer(1, 2), ClassName(item["name"])]
        else:
            cell_icon = [Spacer(1, 15), ClassName(item["name"])]
        
        c_data.append([
            cell_icon, 
            Cell(item["buy_text"]), 
            Cell(item["rule"])
        ])
    
    t2 = Table(c_data, colWidths=[60, 130, 350])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), 
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),   
        ('PADDING', (0, 0), (-1, -1), 6), 
        ('TEXTCOLOR', (0, 1), (0, -1), colors.black),
    ]))
    story.append(t2)

    try:
        doc.build(story)
        print(f"成功生成文件: {filename}")
        for f in os.listdir("."):
            if f.startswith("temp_") and f.endswith(".png"):
                try: os.remove(f)
                except: pass
        print("临时文件已清理。")
    except Exception as e:
        print(f"生成失败: {e}")

if __name__ == "__main__":
    create_pdf("买刀买马.pdf")