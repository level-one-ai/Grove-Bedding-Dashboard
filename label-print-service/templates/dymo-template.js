/**
 * label-print-service/templates/dymo-template.js
 * ────────────────────────────────────────────────
 * Generates DYMO XML matching the Grove Bedding 104x159mm label.
 *
 * Label fields:
 *  - Grove Bedding logo (static embedded image)
 *  - customerName    → TEXT_413  (recipient name)
 *  - orderRef        → TEXT      (Cin7 order number, bold large)
 *  - deliveryDate    → TEXT11    (ETD — configurable via ETD_FIELD_NAME env var)
 *  - parcelCount     → TEXT1112  (e.g. "1/1")
 *  - productName     → TEXT_4    (first line item)
 *  - productSize     → TEXT10    (first line item size/variant)
 *  - extraLine1      → TEXT1012  (second line item)
 *  - extraLine2      → TEXT12    (third line item)
 *  - address         → TEXT211   (full delivery address)
 *  - website         → TEXT_1    (static: www.grovebedding.com)
 */

// Grove Bedding logo extracted from the original .dymo file
const GROVE_LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAMgAAAA1CAYAAAAEVKRZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABFPSURBVHhe7dwDkCRJGwbgs23btm3btm3btuMUZ9u2bdu2678nt7253Lqe3undmd25P+qNyOjpzKzMrKqPb2ZPf3/99deyf5dj6lKXuvy7UJAziho1ajQEBTmm/LtGjRoV1ApSo0YT1ApSo0YT1ApSo0YT1ApSo0YTdLmCfPTRR8Xdd99dnH322cWRRx5ZHHrooenTd/Xaa9TorugSBXnppZeKfffdt5hqqqmK/vrrr5dFP/1dV6NGd0KnKshjjz1WLLPMMm2CP/300+67775X+uTTprrr3+7Zs2fFJdeo0S/RKwry008/FVtttVUSbOHChcU///xTtuw8uC9c4xrXvPCc61bV/8h9VKNGv0UfK8h3331XTDzxxEngBx54YLHbbruVLb2H6413eMW/97ooS43+j95QkDvuuKMYeOCBi0GDBhXbbbdd2dI5MO6YY8YvBht04IDDOOOMMxRnn312cfbZZ5c1NWp0T/S2grz55ptJeMccc4zio48+Klv2Hq537HGPf//111/Llho1+j7+UZD7778/tQ877LC2skuXLmVLt2B+5ZVX0tBmn3vuubKlRo1/AZ28IPX398cff/yx0UONGjX+JTRq1KjRqFGjRqNGjRqNGjVqNGrUqNGo0ahRo0aNGjVq1KhRo0aNGjVqNGrUqNGoUaNGo0aNGo0aNWo0atSo0ahRo0aNGo0aNWo0atSo0ahRo0aNGo0aNWo0atSo0ajRoEHtGjVq1KjRqNGjRqNGjRqNGrUqNGo0ahRo0aNGjVq1KhRo0aNGjVqNGrUqNGoUaNGo0aNGo0aNWo0atSo0ahRo0aNGo0atSo0atSo0ahRo0aNGjVq1KhRo0aNGo0aNWo0atSo0ahRo0aNGo0aNWo0atSo0ahRo0aNGjVq1KhRo0aNGo0atSo0atSo0ahRo0aNGjVq1KhRo0aNGo0aNWo0atSo0ahRo0aNGo0aNWo0atSo0ahRo0aNGjVq1KhRo0aNGo0aNWo0atSo0ShRo0aNGjVq1KhRo0aNGo0aNWo0atSo0ahRo0aNGo0aNWo0atSo0ahRo0aNGjVq1KhRo0aNGo0aNWo0atSoAQA=';

function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textObj(name, text, layout, opts = {}) {
  const {
    fontSize = 12,
    fontName = 'Lucida Grande',
    isBold = 'True',
    hAlign = 'Left',
    vAlign = 'Top',
    fitMode = 'None',
  } = opts;

  return `<TextObject>
          <n>${name}</n>
          <Brushes>
            <BackgroundBrush><SolidColorBrush><Color A="0" R="0" G="0" B="0"></Color></SolidColorBrush></BackgroundBrush>
            <BorderBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></BorderBrush>
            <StrokeBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></StrokeBrush>
            <FillBrush><SolidColorBrush><Color A="0" R="0" G="0" B="0"></Color></SolidColorBrush></FillBrush>
          </Brushes>
          <Rotation>Rotation0</Rotation>
          <OutlineThickness>1</OutlineThickness>
          <IsOutlined>False</IsOutlined>
          <BorderStyle>SolidLine</BorderStyle>
          <Margin><DYMOThickness Left="0" Top="0" Right="0" Bottom="0" /></Margin>
          <HorizontalAlignment>${hAlign}</HorizontalAlignment>
          <VerticalAlignment>${vAlign}</VerticalAlignment>
          <FitMode>${fitMode}</FitMode>
          <IsVertical>False</IsVertical>
          <FormattedText>
            <FitMode>${fitMode}</FitMode>
            <HorizontalAlignment>${hAlign}</HorizontalAlignment>
            <VerticalAlignment>${vAlign}</VerticalAlignment>
            <IsVertical>False</IsVertical>
            <LineTextSpan>
              <TextSpan>
                <Text>${xmlEscape(text)}</Text>
                <FontInfo>
                  <FontName>${fontName}</FontName>
                  <FontSize>${fontSize}</FontSize>
                  <IsBold>${isBold}</IsBold>
                  <IsItalic>False</IsItalic>
                  <IsUnderline>False</IsUnderline>
                  <FontBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></FontBrush>
                </FontInfo>
              </TextSpan>
            </LineTextSpan>
          </FormattedText>
          <ObjectLayout>
            <DYMOPoint><X>${layout.x}</X><Y>${layout.y}</Y></DYMOPoint>
            <Size><Width>${layout.w}</Width><Height>${layout.h}</Height></Size>
          </ObjectLayout>
        </TextObject>`;
}

/**
 * Build complete DYMO XML for a Grove Bedding shipping label.
 *
 * @param {object} data
 * @param {string} data.orderRef      Cin7 order number e.g. "5775-SH"
 * @param {string} data.customerName  Recipient name
 * @param {string} data.deliveryDate  ETD date string (blank until field confirmed)
 * @param {string} data.address       Full delivery address on one line
 * @param {string} data.productName   First line item product name
 * @param {string} data.productSize   First line item size/variant
 * @param {string} data.extraLine1    Second line item (optional)
 * @param {string} data.extraLine2    Third line item (optional)
 * @param {string} data.parcelCount   e.g. "1/1"
 */
function buildDymoXml(data) {
  const {
    orderRef     = '',
    customerName = '',
    deliveryDate = '',
    address      = '',
    productName  = '',
    productSize  = '',
    extraLine1   = '',
    extraLine2   = '',
    parcelCount  = '1/1',
  } = data;

  return `<?xml version="1.0" encoding="utf-8"?>
<DesktopLabel Version="1">
  <DYMOLabel Version="3">
    <Description>DYMO Label</Description>
    <Orientation>Landscape</Orientation>
    <LabelName>1933086 LW DURABLE 104x159mm</LabelName>
    <InitialLength>0</InitialLength>
    <BorderStyle>SolidLine</BorderStyle>
    <DYMORect>
      <DYMOPoint><X>0.22</X><Y>0.05666666</Y></DYMOPoint>
      <Size><Width>6</Width><Height>4</Height></Size>
    </DYMORect>
    <BorderColor><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></BorderColor>
    <BorderThickness>1</BorderThickness>
    <Show_Border>False</Show_Border>
    <DynamicLayoutManager>
      <RotationBehavior>ClearObjects</RotationBehavior>
      <LabelObjects>
        <ImageObject>
          <n>IImageObject0</n>
          <Brushes>
            <BackgroundBrush><SolidColorBrush><Color A="0" R="0" G="0" B="0"></Color></SolidColorBrush></BackgroundBrush>
            <BorderBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></BorderBrush>
            <StrokeBrush><SolidColorBrush><Color A="1" R="0" G="0" B="0"></Color></SolidColorBrush></StrokeBrush>
            <FillBrush><SolidColorBrush><Color A="0" R="0" G="0" B="0"></Color></SolidColorBrush></FillBrush>
          </Brushes>
          <Rotation>Rotation0</Rotation>
          <OutlineThickness>1</OutlineThickness>
          <IsOutlined>False</IsOutlined>
          <BorderStyle>SolidLine</BorderStyle>
          <Margin><DYMOThickness Left="0" Top="0" Right="0" Bottom="0" /></Margin>
          <Data>${GROVE_LOGO_B64}</Data>
          <ScaleMode>Uniform</ScaleMode>
          <HorizontalAlignment>Center</HorizontalAlignment>
          <VerticalAlignment>Middle</VerticalAlignment>
          <ObjectLayout>
            <DYMOPoint><X>0.22</X><Y>0.1782548</Y></DYMOPoint>
            <Size><Width>1.9986</Width><Height>0.5396663</Height></Size>
          </ObjectLayout>
        </ImageObject>
        ${textObj('TEXT_413', customerName, { x:'0.22', y:'0.7469166', w:'5.901835', h:'0.3913665' }, { fontSize:24.4, fontName:'Arial', isBold:'False', fitMode:'AlwaysFit' })}
        ${textObj('TEXT2', 'ORDER REF', { x:'0.228806', y:'1.17607', w:'3.3822', h:'0.2524058' }, { fontSize:12, fontName:'Lucida Grande', isBold:'True' })}
        ${textObj('TEXT', orderRef, { x:'0.22', y:'1.392532', w:'3.78529', h:'0.442094' }, { fontSize:25.3, fontName:'Calibri', isBold:'True', fitMode:'AlwaysFit' })}
        ${textObj('TEXT9', 'DELIVERY DATE', { x:'4.126202', y:'1.17607', w:'1.900718', h:'0.3218499' }, { fontSize:12, fontName:'Lucida Grande', isBold:'True' })}
        ${textObj('TEXT11', deliveryDate, { x:'4.125656', y:'1.428476', w:'2.076283', h:'0.4862129' }, { fontSize:16, fontName:'Calibri', isBold:'False' })}
        ${textObj('TEXT1112', parcelCount, { x:'4.447117', y:'0.05666666', w:'1.579803', h:'0.6593858' }, { fontSize:36, fontName:'Calibri', isBold:'True', hAlign:'Right' })}
        ${textObj('TEXT_4', productName, { x:'0.22', y:'1.834626', w:'5.901835', h:'0.4129503' }, { fontSize:25, fontName:'Arial', isBold:'True', fitMode:'AlwaysFit' })}
        ${textObj('TEXT10', productSize, { x:'0.2376348', y:'2.286397', w:'5.901836', h:'0.2555635' }, { fontSize:12, fontName:'Arial', isBold:'False' })}
        ${textObj('TEXT1012', extraLine1, { x:'0.2364845', y:'2.548134', w:'5.901836', h:'0.2198492' }, { fontSize:12, fontName:'Arial', isBold:'False' })}
        ${textObj('TEXT12', extraLine2, { x:'0.2364845', y:'2.795099', w:'5.901836', h:'0.2555635' }, { fontSize:12, fontName:'Arial', isBold:'False' })}
        ${textObj('TEXT810', 'DELIVERY ADDRESS', { x:'0.2426573', y:'3.019798', w:'1.900718', h:'0.2424852' }, { fontSize:12, fontName:'Lucida Grande', isBold:'True' })}
        ${textObj('TEXT211', address, { x:'0.2376348', y:'3.23142', w:'5.896926', h:'0.5906798' }, { fontSize:15.2, fontName:'Lucida Grande', isBold:'True', fitMode:'AlwaysFit' })}
        ${textObj('TEXT_1', 'www.grovebedding.com', { x:'3.725731', y:'3.724596', w:'2.37613', h:'0.3320709' }, { fontSize:12, fontName:'Lucida Grande', isBold:'True', hAlign:'Right' })}
      </LabelObjects>
    </DynamicLayoutManager>
  </DYMOLabel>
  <LabelApplication>Blank</LabelApplication>
  <DataTable><Columns></Columns><Rows></Rows></DataTable>
</DesktopLabel>`;
}

module.exports = { buildDymoXml, xmlEscape };
