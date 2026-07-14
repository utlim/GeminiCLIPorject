/**
 * 프로젝트명: YES24 컴퓨터/IT 베스트셀러 EDA 마크다운 보고서의 DOCX 변환기
 * 파일 역할: 마크다운 파일(EDA_Report.md)을 읽고 파싱하여 docx-js 라이브러리를 이용해 고품질 워드 문서(EDA_Report.docx)로 자동 변환합니다.
 * 주요 기능:
 *   - 마크다운 제목(H1~H4), 본문 단락 파싱 및 변환
 *   - 볼드(**굵게**) 인라인 스타일 파싱 및 TextRun 매핑
 *   - 목록(불릿/번호/체크리스트)의 docx 규격 변환
 *   - 테이블(Table)의 컬럼 너비 계산(DXA), 정렬 및 셀 셰이딩/여백 스타일링 적용
 *   - 이미지(ImageRun)의 상대 경로 해석, 자동 크기 조절 및 Alt 텍스트 부여
 *   - Callout Box(인용구/경고창) 스타일링 구현
 * 작성자: Antigravity AI
 * 생성일: 2026-07-13
 */

const fs = require('fs');
const path = require('path');
const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
    AlignmentType, PageOrientation, LevelFormat, BorderStyle, WidthType, ShadingType,
    PageNumber, Header, Footer
} = require('docx');

// 인라인 스타일(볼드 **) 파싱 함수
function parseInlineStyles(text) {
    const runs = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        // 일치하기 전의 일반 텍스트 추가
        if (match.index > lastIndex) {
            runs.push(new TextRun({
                text: text.substring(lastIndex, match.index),
                font: "Arial"
            }));
        }
        // 볼드 텍스트 추가
        runs.push(new TextRun({
            text: match[1],
            bold: true,
            font: "Arial"
        }));
        lastIndex = boldRegex.lastIndex;
    }

    // 남은 텍스트 추가
    if (lastIndex < text.length) {
        runs.push(new TextRun({
            text: text.substring(lastIndex),
            font: "Arial"
        }));
    }

    // 텍스트가 완전히 비어 있는 경우 방지
    if (runs.length === 0 && text.length > 0) {
        runs.push(new TextRun({ text: text, font: "Arial" }));
    }
    return runs;
}

// 테이블 셀 가로 폭 계산 및 매핑
function createWordTable(markdownRows) {
    if (markdownRows.length === 0) return null;

    // 헤더 구분선(---|---) 제외 처리
    const cleanRows = markdownRows.filter(row => !row.match(/^\|\s*[:\-]+\s*\|/));
    if (cleanRows.length === 0) return null;

    // 각 행의 셀 텍스트 분리
    const parsedRows = cleanRows.map(row => {
        // 양 끝의 '|' 제거 후 split
        const cells = row.replace(/^\|/, '').replace(/\|$/, '').split('|');
        return cells.map(cell => cell.trim());
    });

    const colCount = Math.max(...parsedRows.map(r => r.length));
    
    // US Letter 페이지 가로 폭 기준 (12,240 DXA - 2,880 여백 = 9,360 DXA)
    const totalTableWidth = 9360;
    const colWidth = Math.floor(totalTableWidth / colCount);
    const colWidths = Array(colCount).fill(colWidth);

    const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

    const wordRows = parsedRows.map((rowCells, rowIndex) => {
        const cellObjects = Array(colCount).fill("").map((_, colIndex) => {
            const cellText = rowCells[colIndex] || "";
            const isHeader = rowIndex === 0;

            return new TableCell({
                width: { size: colWidths[colIndex], type: WidthType.DXA },
                shading: {
                    fill: isHeader ? "D5E8F0" : "F5F5F5",
                    type: ShadingType.CLEAR
                },
                borders: cellBorders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: parseInlineStyles(cellText)
                    })
                ]
            });
        });

        return new TableRow({ children: cellObjects });
    });

    return new Table({
        width: { size: totalTableWidth, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: wordRows
    });
}

function main() {
    const mdFilePath = path.join(__dirname, '../reports/EDA_Report.md');
    const docxFilePath = path.join(__dirname, '../reports/EDA_Report.docx');

    if (!fs.existsSync(mdFilePath)) {
        console.error(`[오류] 마크다운 파일을 찾을 수 없습니다: ${mdFilePath}`);
        process.exit(1);
    }

    console.log(`[시작] 마크다운 파일 읽기 및 변환 중: ${mdFilePath}`);
    const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
    const lines = mdContent.split(/\r?\n/);

    const docChildren = [];
    let currentTableRows = [];
    let inTable = false;
    
    let inCallout = false;
    let calloutType = "";
    let calloutTextList = [];

    // 리스트 번호 추적
    let listCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. 테이블 파싱 처리
        if (trimmed.startsWith('|')) {
            if (inCallout) {
                // Callout 종료 처리
                flushCallout(docChildren, calloutType, calloutTextList);
                inCallout = false;
            }
            inTable = true;
            currentTableRows.push(line);
            continue;
        } else {
            if (inTable) {
                // 테이블 종료 및 워드 테이블 생성
                const wordTable = createWordTable(currentTableRows);
                if (wordTable) {
                    docChildren.push(wordTable);
                    // 테이블 간 간격을 위한 공백 추가
                    docChildren.push(new Paragraph({ spacing: { after: 120 } }));
                }
                currentTableRows = [];
                inTable = false;
            }
        }

        // 2. Callout Box (Note/Warning 등 인용구) 파싱 처리
        if (trimmed.startsWith('>')) {
            inCallout = true;
            // > [!NOTE] 와 같은 마크다운 확장 경고구문
            const noteMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
            if (noteMatch) {
                calloutType = noteMatch[1].toUpperCase();
            } else {
                const textContent = trimmed.replace(/^>\s*/, '');
                if (textContent.length > 0) {
                    calloutTextList.push(textContent);
                }
            }
            continue;
        } else {
            if (inCallout) {
                flushCallout(docChildren, calloutType, calloutTextList);
                calloutType = "";
                calloutTextList = [];
                inCallout = false;
            }
        }

        // 빈 라인 무시
        if (trimmed.length === 0) continue;

        // 3. 제목 파싱 (H1 ~ H4)
        if (trimmed.startsWith('#')) {
            const h1Match = trimmed.match(/^#\s+(.+)$/);
            const h2Match = trimmed.match(/^##\s+(.+)$/);
            const h3Match = trimmed.match(/^###\s+(.+)$/);
            const h4Match = trimmed.match(/^####\s+(.+)$/);

            if (h1Match) {
                docChildren.push(new Paragraph({
                    heading: "Heading1",
                    spacing: { before: 240, after: 120 },
                    children: parseInlineStyles(h1Match[1])
                }));
            } else if (h2Match) {
                docChildren.push(new Paragraph({
                    heading: "Heading2",
                    spacing: { before: 180, after: 120 },
                    children: parseInlineStyles(h2Match[1])
                }));
            } else if (h3Match) {
                docChildren.push(new Paragraph({
                    heading: "Heading3",
                    spacing: { before: 120, after: 80 },
                    children: parseInlineStyles(h3Match[1])
                }));
            } else if (h4Match) {
                docChildren.push(new Paragraph({
                    heading: "Heading4",
                    spacing: { before: 100, after: 60 },
                    children: parseInlineStyles(h4Match[1])
                }));
            }
            continue;
        }

        // 4. 이미지 파싱 (![altText](path))
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
            const altText = imgMatch[1] || "Image";
            let imgRelPath = imgMatch[2];
            
            // 상대경로(../images/...)를 실제 파일 경로(yes24/images/...)로 계산
            // 리포트는 reports/ 에 있고 스크립트는 src/ 에 있으므로
            // imagesDir은 yes24/images 에 있음
            let imgFullPath = "";
            if (imgRelPath.startsWith('../images/')) {
                imgFullPath = path.join(__dirname, '../images', imgRelPath.replace('../images/', ''));
            } else if (imgRelPath.startsWith('images/')) {
                imgFullPath = path.join(__dirname, '../images', imgRelPath.replace('images/', ''));
            } else {
                imgFullPath = path.resolve(__dirname, '..', imgRelPath);
            }

            if (fs.existsSync(imgFullPath)) {
                try {
                    const ext = path.extname(imgFullPath).toLowerCase().replace('.', '');
                    // docx-js 규정: altText에 title, description, name 모두 필요
                    docChildren.push(new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                        children: [
                            new ImageRun({
                                data: fs.readFileSync(imgFullPath),
                                type: ext === 'jpg' ? 'jpeg' : ext,
                                transformation: { width: 500, height: 300 }, // 기본 가로 세로 픽셀
                                altText: { title: altText, description: altText, name: altText }
                            })
                        ]
                    }));
                    // 이미지 하단에 서명(캡션) 추가
                    docChildren.push(new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 180 },
                        children: [new TextRun({ text: `그림: ${altText}`, font: "Arial", size: 18, italic: true })]
                    }));
                } catch (err) {
                    console.error(`[오류] 이미지 처리 실패: ${imgFullPath}, 에러: ${err}`);
                }
            } else {
                console.warn(`[경고] 이미지 파일을 찾을 수 없습니다: ${imgFullPath}`);
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: `[누락 이미지: ${altText} - ${imgRelPath}]`, font: "Arial", color: "FF0000" })]
                }));
            }
            continue;
        }

        // 5. 구분선 처리 (---)
        if (trimmed === '---') {
            const borderStyle = { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 };
            docChildren.push(new Paragraph({
                border: { bottom: borderStyle },
                spacing: { before: 180, after: 180 }
            }));
            continue;
        }

        // 6. 리스트/항목 처리
        // 6-1. 체크리스트
        const checkMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (checkMatch) {
            const isChecked = checkMatch[1].toLowerCase() === 'x';
            const checkText = isChecked ? "☑  " : "☐  ";
            
            docChildren.push(new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                spacing: { after: 80 },
                children: [
                    new TextRun({ text: checkText, font: "Arial", bold: true }),
                    ...parseInlineStyles(checkMatch[2])
                ]
            }));
            continue;
        }

        // 6-2. 불릿 리스트
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            docChildren.push(new Paragraph({
                numbering: { reference: "bullets", level: 0 },
                spacing: { after: 80 },
                children: parseInlineStyles(bulletMatch[1])
            }));
            continue;
        }

        // 6-3. 숫자 리스트
        const numListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (numListMatch) {
            docChildren.push(new Paragraph({
                numbering: { reference: "numbers", level: 0 },
                spacing: { after: 80 },
                children: parseInlineStyles(numListMatch[1])
            }));
            continue;
        }

        // 7. 일반 텍스트
        docChildren.push(new Paragraph({
            spacing: { after: 120 },
            children: parseInlineStyles(trimmed)
        }));
    }

    // 혹시 파일 끝에 남은 Table 이나 Callout 이 있으면 flush
    if (inTable && currentTableRows.length > 0) {
        const wordTable = createWordTable(currentTableRows);
        if (wordTable) docChildren.push(wordTable);
    }
    if (inCallout && calloutTextList.length > 0) {
        flushCallout(docChildren, calloutType, calloutTextList);
    }

    // 워드 문서 디자인 및 메타데이터 빌드
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Arial", size: 22, color: "333333" } // 11pt default
                }
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 32, bold: true, font: "Arial", color: "1A365D" }, // 16pt 딥네이비
                    paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 26, bold: true, font: "Arial", color: "2B6CB0" }, // 13pt 블루
                    paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 22, bold: true, font: "Arial", color: "2D3748" }, // 11pt 다크그레이
                    paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 }
                }
            ]
        },
        numbering: {
            config: [
                {
                    reference: "bullets",
                    levels: [{
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "•",
                        alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 432, hanging: 216 } } }
                    }]
                },
                {
                    reference: "numbers",
                    levels: [{
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 432, hanging: 216 } } }
                    }]
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 12240, height: 15840 }, // US Letter 사이즈 강제 적용
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1인치 마진
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 120 },
                            children: [
                                new TextRun({
                                    text: "YES24 IT 베스트셀러 심층 EDA 보고서  |  Antigravity 데이터 분석 팀",
                                    font: "Arial",
                                    size: 16,
                                    color: "718096"
                                })
                            ]
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: "Page ",
                                    font: "Arial",
                                    size: 16,
                                    color: "718096"
                                }),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: "Arial",
                                    size: 16,
                                    color: "718096"
                                })
                            ]
                        })
                    ]
                })
            },
            children: docChildren
        }]
    });

    Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(docxFilePath, buffer);
        console.log(`[성공] DOCX 보고서 파일이 정상 생성되었습니다: ${docxFilePath}`);
    }).catch(err => {
        console.error(`[오류] DOCX 빌드 중 에러가 발생했습니다: ${err}`);
        process.exit(1);
    });
}

// Callout Box를 워드 요소로 출력 (연한 배경색과 테두리 스타일)
function flushCallout(childrenList, type, textLines) {
    if (textLines.length === 0) return;
    
    const calloutColors = {
        NOTE: { bg: "EDF2F7", border: "4A5568", title: "안내 (Note)" },
        TIP: { bg: "E6FFFA", border: "319795", title: "팁 (Tip)" },
        IMPORTANT: { bg: "EBF8FF", border: "2B6CB0", title: "중요 (Important)" },
        WARNING: { bg: "FEFCBF", border: "D69E2E", title: "경고 (Warning)" },
        CAUTION: { bg: "FFF5F5", border: "E53E3E", title: "주의 (Caution)" }
    };

    const style = calloutColors[type] || calloutColors.NOTE;
    const borderStyle = { style: BorderStyle.SINGLE, size: 24, color: style.border };

    const paragraphs = [
        new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
                new TextRun({ text: `[${style.title}]`, bold: true, font: "Arial", color: style.border, size: 20 })
            ]
        }),
        ...textLines.map(line => new Paragraph({
            spacing: { before: 40, after: 40 },
            children: parseInlineStyles(line)
        }))
    ];

    // 테이블 1행 1열 구조로 예쁜 callout 상자 구현
    const tableCell = new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: style.bg, type: ShadingType.CLEAR },
        borders: {
            left: borderStyle,
            top: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE }
        },
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        children: paragraphs
    });

    childrenList.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [tableCell] })]
    }));
    
    // Callout 상자 뒤에 약간의 여백 추가
    childrenList.push(new Paragraph({ spacing: { after: 120 } }));
}

main();
