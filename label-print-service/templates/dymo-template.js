/**
 * label-print-service/templates/dymo-template.js
 * ────────────────────────────────────────────────
 * Builds a complete DYMO XML string from label data,
 * matching the exact structure of Label_1__1_.dymo
 * (1933086 LW DURABLE 104×159mm, Landscape)
 *
 * The base64 logo string is the image embedded directly
 * in the original .dymo file — no external image needed.
 */

const GROVE_LOGO_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAAA1CAYAAAAEVKRZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABFPSURBVHhe7dwDkCRJGwbgs23btm3btm3btuMUZ9u2bdu2678nt7653Lqe3undmd25P+qNyOjpzKzMrKqPb2ZPf3/99deyf5dj6lKXuvy7UJAziho1ajQEBTmm/LtGjRoV1ApSo0YT1ApSo0YT1ApSo0YT1ApSo0YT1ApSo0YTdLmCfPTRR8Xdd99dnH322cWRRx5ZHHrooenTd/Xaa9TorugSBXnppZeKfffdt5hqqqmK/vrrr5dFP/1dV6NGd0KnKshjjz1WLLPMMm2CP/300xe77757ceWVVxbPPvts8e677xYffvhh+nzuuedSvXb94hrXP/roo+WINWr0W3SKgvzwww/FVlttlQR84IEHLnbdddfilVdeKVs7Bv1d53rjGM+4NWr0S/Sxgrz44ovFZJNNloR68803Lz755JOypffgeuMYz7gvvPBC2VKjRt9HHynIww8/XAw55JDFUEMNVdx4441lbefgpptuSmMPMcQQxYMPPljW1qjRd9HbCvL8888n4R1jjDGKV199taztXBh3zDHHLAYffPCUs9So0bfRWwryzTffFOONN14x7LDDFm+88UZZ2zV488030zzmM2+N7gle/o477kiRREfYyO+++6645ZZbirvuuqu44YYbii+++KJs6V7oLQVZe+21U45w7733ljVdC/OYb5111ilrWsPXX39dnH/++cV6661XzDXXXMUcc8xRLLXUUsVOO+1UnHvuuf83ezHHHXdcseWWW6b72nrrrYv1118/3bPPHXbYobjggguKjz/+uOzduTj66KOLoYceOr2nbbfdtqxtH5999lmbHCkUJcfLL79cnHHGGcX9999f1vQbtKwgDz30ULqh7bffvqzpOzCfeVvNRwjFOOOM0/YiFllkkWKllVYqRh999La6Qw45pOz938YjjzxSjDXWWOmexh9//GK33XYr9txzz/TsZp555lQ/0kgjFRdeeGF5Rediv/32S3NQ0I5ihhlmSNdUja0NZfWLL754WdNv0LKCzDvvvMlS9G0K9vvvv0/zmr+jOO2009JDViaeeOKeqOeff/65mH/++VPbQQcdVNb+90Eh3NM222xT1vyDww47LLUNOuigxfvvv1/Wdh5OPfXUNP7OO+9c1vQaiy22WLqmqiCXXXZZUp999tmnrOk3aElBxJZu5phjelzy22+/pURa7HnRRRcVJ510UnHyySenm7vnnnuKt99+u/h7/NS3MxAvn/vtFV577bW2PRXFGqvwUuQ3cT//DyBQ7neTTTYpa/7Bt99+m+5Xe2ezjhAGqRUFWWKJJdI1fStcbxUtKcjBBx+cbsaxkBVXXLEYfvjh0/dmRSiz2mqrJaXp0yQbIWDMAw44oKxpH2LxWMO0005b1v4bYvLcG8pVjL///vujjUshGjzwwAPp+6abbpr65HjvvfeK008/PcXUwjehjQQ0B9raGTQGRDnhhBNS3M6TMSInnjhiqtPG0juVELBG8fhaa61VrLLKKsWBBx5YPPXUU2Vrz9h7773TPTdSEIlxvLNqzB9466230loZOP2bQR7B8Nx8883FO++8k9Zo7GYKwqAa3/xfffVV28mLXEEYVv2UfF9NLmnfTSSgLaC/LYdeeUWnOG699db0bpA/n376afHBBx+k662lEVpSkAhJlBFGGKFYeeWVi+OPPz5N+Mwzz6RFW/wTTzxRXHfddelFsxD2M1yDrt1iiy3STfYuJp988mK22WYrvzUGzzbhhBO2rdXGY0dx1llnFQMNNFDbtcsuu2yKqeO7kod5BHu44YZL9dalf/RDCBAc8DwGGGCAtjZFMvvrr78mBdlxxx3b6ln5OG5zzjnnFCOPPHKqn2+++YoFF1ww/W0sylBFKAhFruLOO+9MbXKyqvB/+eWXxRprrFGMO+64Ke6feuqpi1FHHTUpfhWer/WOOOKIxeyzz57CJCEsyt/4jRTk9ddfLxZddNE05sILL5yeobnIkWtyBTn22GPT2P//388ydAFyNd1006V7tz4eccMNN0z7cMbwecQRR5S9/8FPP/2UZMBzdG/WQSbNbQ3WtMsuu5S9e0aHFcRiJppoouQNWI1ffvmlbOk1WGhWhtdxI8ryyy9f3HfffWWPjsF5rimmmKIYcMABm+ZArMMggwzSNlejh9YMXnBca6+HlZPYjj322KkuFOTyyy9v67fCCiukOqA0UT/jjDO2PSshaNRTguozDOKANQSWNvqvueaaqQ48u6i/9tpry9oeCAXZbLPNypoiKSAPyGigyxEtOX788ccU7w822GBtJxco7jzzzJPGqnpDXlK9E9kBChDPp6ogLDflGWaYYdL+WUBYrr9SDbF4SfVV48a4Uhz3QjF5dcaEN46xqjQz9lP9mWeeWdb0YPzUeZciE2tshA4rCIvTGXsexkA5hgBPMskk6cCimJgH4kYJDgUg6BRLO8+hP+u+7rrrppfaHh5//PHUNwqv0Aok7XEtgfr9999TPcMgjKIArGgcsVGuv/761AcYk7CMikOZICQJKlTJwxz3SvGDtfnjjz/aGB4FQxXIBQsrlyMUZJRRRinmnHPOYpZZZklWUh0r76BoFSFcwrscwhH1BDFgz0LdcsstV9b8A6G3tqqCbLzxxqn+vPPOK2v+QRxUrSrIJZdckupzDwI8XYSJ1ffqWajndQPCLnUUlKEIeH+eEXlqRvN3WEE6G4SFoAX9GIV14CpzD6AQFiFbR5SURcmvzS0dYWc9CIWYXznqqKN6ethhvRTuuBHkAPkcQswcM800U1tb/pJ5mqh3IDMQFGl41bCU6jwLysmAsNQ5O+cl5940FISiEXACffHFFyeql9cikOGhgNCEkFZPK5hLPWo4DJIwTF0jo3PKKaektlxBsI/CJcof4WYOz9c1VQUJI1BVEHIT4REhz7Hddtula4T9gTCWjfLQ+DlGbnyq6GcKkoOWe5kEVywofhafC414llYpSS/ajUcxboBlDjYsLxLoQK4gCy20UFnbM+QU0YcAY81yiLOjXWgZQFZEPe9kPYr4mKAGeM7oJ+YmFFHkcgROvbAFSRAIBcmVL3DVVVelNgIfyS9vFzmOcJDXkVfYTGW8zGPOsLL66Gt9VTRisSi6OorcKOlvj8VqpiDCXnmD3CLHXnvtla5h9AJkh6HhdRAiASEkxfUMu6UH6Uo4tpAzbI0SsIivlQUWWKCs7YGOKMjVV1/d1oebrh7vjxeviNkDmDwCGm3yqghlIhSDCGUU9yJvkB9Qfp+obsW8XnYgFKQRiwURqmKcIMI+lDihZ3ExaIq/Y44IM+P6al4CjfZBwoLLr3iTKpZccsnU3qqCULhqmN1IQcBJAvVCdffx559/ttHhjQxJjj5WEBrKmtqN5sYxPvYVbrvttuLzzz8ve/V9sIAegNJoNzZnm/ydoyMKggaNPsqTTz5ZtvSA5C/aqpt2cqho87yEGXbAQwhBUh19bOx19GcEvVKQueeeO7WjsUF4xoOwsu0lqjkiJCbAVTSieWPvjNdrZKn7hoJ4rggmntD6sY2et2eVP/NG6C0FwRlzp7POOmtaUBSWNOLmKF6+GLgZ69QViHhYEYbgvHNEQqcsvfTSZW0P5Em6UKkRJItB7ypXXHFF2dIDXki05Qk85OETwfFpvTmQFXmijwGrgjephp/NNgpZzjh2450EwphceumlZU3PcF0gcpBGR42Cqs49tvdOmNUzKlVMOumkqa3KaFqf+qqFZ3QJeqMQK4yD3DaHcN2WhMji6aefTvliR1nYlhTES2NdLdBCCAG3dfvtt6fNFjGmEEIizasE96yvMEFfiV9nQNzeDOLNnAXiZgOsUKxLqSpInqOwuO2BIES/nNUhCGEoGJFqMunFBiWqjDbaaA3Dj3xvhDKyqjwJJkoiql6fHM2Omhx++OGpzdz5xlhYfuFTrnCeoXeYW3FhoL6eX06YXHPNNW2KUF1THErkyUPZ/pa7tKEaBiInDgCtrt6+WQ45k5xP/mCMHOTLNTkbZ43qWjkflqPDCsIVhXsVX7e3E1uF+JgFjTM3ipO0Yng32wrsKNvF3mCDDdrd+czhZeebmzaZcOLxIiVoPvONP6dHc8utsO65FQ0QoNgTUDBUXpIQwHcUayPmBrz4uC7CnSqEEPlv/KvFnlTuGW2kBaXrsCJlQb1SlkiuPYPqLjxjYyztknLvl9GguCy8cQOeQ4SnQj/37PnZmwkFFL54jiHAdudjExGtz5pbh/X5W73nqB94ZuHVvKvYNGVYPCv1CvIlEm+5XHhHZEccRyIDYQx5nQkmmCA9GwQJFstGI4q9PXRYQdwsHh3337vAaNgDEfJYsI0piiN/YYHE8RJCjJBE1EPGnXPnaNOwym6sFWDCHP/2InmVVVddNW2w+bdDjm/koYXj7xtttFFyywpBZn2axaoMAEvrpVIKYwoRqp4jB1dPKIQsvcovWG17CcJVOZG5GhkouZ9+1o0JtA6FUSCMyIBm92HNjrJQJvPwUjkBEHBf5tLHaQH0O8XhBQj86quvnsKd3MuLMNCwGDJ5B0YN0O2U0zuJ9yD6YATdh1ARDQ/YOt8pvPfpHiNvEvLHvRP6fC8klMq7n3LKKVPhLcmfenLd3rGalkIsws3CVOP5VsEyUgiu1y8GLbJXJay/v9s7FlCjRhVyQylBoxwOaTDNNNMkmaqSBIGWFMSGisEaTdYnYBmwNuJOVot1EkeyzMKBCKdid7Uar9ao0R5iM7A9b+5Ijvb2NgtbUhBhFtck1msUk3c1JJfOYllHjRodgT2u9jyEk7xOF4hOGoWS0JKCQOzGVrnmrob5zCu5724Qa7dnMNCcYb30y9mqRlQj5c/zBOO6Rr3+2nway7j5GPlcPhsZEoIQ+wfajR1rz9vaQ1WQ9LemfD2xVt/jXlwXtKz29gSys+FwpDAKWybXkY/4taI8U3iPxKlS5TlaVhCQ7MpFmmX/nYk4yJezTd0FiASJKQtF0BzVjuQUJS5pRDygv+VcklICwtBItiWXOZxO1c9ONiGTcGKHCJrkFYPkXJY8UDIs+QaJsuTVXOh45IKNs/wdCVflcea2RuSHPvprk9DH71/cR7BKAWQBIYsQ236RZBljhGEMAST87t13SbTwxdiO2YC1mru6P9RVoKh2/q3NvJ6Tv9vLO3L0loJ4cBgAbEBXbwAa3zwsACakuwEThhYl6ISOZQqrjpmxh2Bzy94FJi5+bOXsFxYL2xOgOGhTYYHDgO4dM+Y3GdpYa+OHl6AcjqSA4/CUAiMmp7MRaqx8h5+QYJ38LoTCYRAJuXUTVsdvMF1gniodTLkxV7GnhIHLmaQ99tij7YwWli2UV27JUodAGtu+0X/hl5y9pSAQZ4VspDXa5OoMGDfOTIUgdDcQQEoQngDTF7Skw5Y8CMoajcgbaCOQrHgjKpjCEDqCqo2XERLYMyLUrHeELax97FHEXHbX7fK7Rp04O8CSo7FZeN4OG8iDUGDXEXztYJ2sbX5cCPPoHigKGJ8Hcd4KrCeUynjhjXhZ/10ldu9tTLq20YHH7obeVhBgDQmvGK96mrVPYTy/GjN+9Seu3Q0RUgXyU6P+DoHmBcThPpuhms905BrI5wpU11aFsWM+ffO184TVtVQVWv9qXSNYVz42VMfujugjBQFxsR1V57Cq8XTvwjhyDuMav0aNfoU+VhDwQx4JNGvP6tuvCMaio9DfdcFb+/11/sP8GjX6BTpFQQJCIWddCLjDieJVzAWWA4sT7t6n7+q16xcnY52TafTTzBo1+gU6VUGA8EtAHXbL/y+VkMkhQAfGKI/v0aaf/q6rxtA1avRLdLqC5MCvO/rt+Ihz/Q7COfXp03f12vWrUaM7oksVpEaN/zpqBalRowlqBalRowlqBalRowlqBalRowlqBalRowlqBalRowkoSI9/sVejRo0KiuJ/CyIE/Sv1ggUAAAAASUVORK5CYII=';

/**
 * Escapes characters that would break XML
 */
function xmlEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds a single TextObject block matching the .dymo XML structure
 */
function textObject(name, text, fontName, fontSize, isBold, hAlign, vAlign, fitMode, x, y, w, h) {
  return `
        <TextObject>
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
            <DYMOPoint><X>${x}</X><Y>${y}</Y></DYMOPoint>
            <Size><Width>${w}</Width><Height>${h}</Height></Size>
          </ObjectLayout>
        </TextObject>`;
}

/**
 * Builds the complete DYMO XML string from label data.
 * Field positions are taken directly from the original Label_1__1_.dymo file.
 *
 * @param {object} labelData
 * @param {string} labelData.orderRef
 * @param {string} labelData.customerName
 * @param {string} labelData.productName     — "Product Name - Size"
 * @param {string} labelData.productSize     — size only
 * @param {string} labelData.address
 * @param {string} labelData.deliveryDate
 * @param {string} labelData.packageCount    — e.g. "1/1"
 * @param {string} labelData.website
 * @returns {string} Complete DYMO XML
 */
export function buildDymoXml(labelData) {
  const {
    orderRef     = '',
    customerName = '',
    productName  = '',
    productSize  = '',
    address      = '',
    deliveryDate = '',
    packageCount = '1/1',
    website      = 'www.grovebedding.com',
  } = labelData;

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
${textObject('TEXT',   orderRef,     'Calibri',       25.3, 'True',  'Left',  'Top',    'AlwaysFit', 0.22,      1.392532, 3.78529,  0.442094)}
${textObject('TEXT2',  'ORDER REF',  'Lucida Grande', 12,   'True',  'Left',  'Top',    'None',      0.228806,  1.17607,  3.3822,   0.2524058)}
${textObject('TEXT_1', website,      'Lucida Grande', 12,   'True',  'Right', 'Middle', 'None',      3.725731,  3.724596, 2.37613,  0.3320709)}
${textObject('TEXT_4', productName,  'Arial',         25,   'True',  'Left',  'Top',    'AlwaysFit', 0.22,      1.834626, 5.901835, 0.4129503)}
${textObject('TEXT211',address,      'Lucida Grande', 15.2, 'True',  'Left',  'Top',    'AlwaysFit', 0.2376348, 3.23142,  5.896926, 0.5906798)}
${textObject('TEXT11', deliveryDate, 'Calibri',       16,   'False', 'Left',  'Top',    'None',      4.125656,  1.428476, 2.076283, 0.4862129)}
${textObject('TEXT9',  'DELIVERY DATE', 'Lucida Grande', 12, 'True', 'Left', 'Top',    'None',      4.126202,  1.17607,  1.900718, 0.3218499)}
${textObject('TEXT1112',packageCount,'Calibri',       36,   'True',  'Right', 'Top',    'None',      4.447117,  0.05666666, 1.579803, 0.6593858)}
${textObject('TEXT810','DELIVERY ADDRESS','Lucida Grande',12,'True', 'Left',  'Top',    'None',      0.2426573, 3.019798, 1.900718, 0.2424852)}
${textObject('TEXT10', productSize,  'Arial',         12,   'False', 'Left',  'Top',    'None',      0.2376348, 2.286397, 5.901836, 0.2555635)}
${textObject('TEXT_413',customerName,'Arial',         24.4, 'False', 'Left',  'Top',    'AlwaysFit', 0.22,      0.7469166,5.901835, 0.3913665)}
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
      </LabelObjects>
    </DynamicLayoutManager>
  </DYMOLabel>
  <LabelApplication>Blank</LabelApplication>
  <DataTable>
    <Columns></Columns>
    <Rows></Rows>
  </DataTable>
</DesktopLabel>`;
}
