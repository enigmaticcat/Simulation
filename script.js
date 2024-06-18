class PageTableEntry {
    constructor(pageNumber, frameNumber, valid, timestamp) {
        this.pageNumber = pageNumber;
        this.frameNumber = frameNumber;
        this.valid = valid;
        this.timestamp = timestamp;
    }
}

class TLBEntry {
    constructor(pageNumber, frameNumber) {
        this.pageNumber = pageNumber;
        this.frameNumber = frameNumber;
    }
}

class MemoryManagementUnit {
    constructor(numPages, numFrames, pageSize, tlbSize = 16) {
        this.numPages = numPages;
        this.numFrames = numFrames;
        this.pageSize = pageSize;
        this.pageTable = Array.from({ length: numPages }, (_, i) => new PageTableEntry(i, -1, false, null));
        this.TLB = [];
        this.tlbSize = tlbSize;
        this.frames = Array(numFrames).fill(null);
        this.frameCounter = 0;
    }

    getPhysicalAddress(logicalAddress) {
        let pageNumber = Math.floor(logicalAddress / this.pageSize);
        let offset = logicalAddress % this.pageSize;

        // Check TLB
        let tlbEntry = this.TLB.find(entry => entry.pageNumber === pageNumber);
        if (tlbEntry) {
            console.log("TLB HIT");
            return tlbEntry.frameNumber * this.pageSize + offset;
        } else {
            console.log("TLB MISS");
            let pageTableEntry = this.pageTable[pageNumber];
            if (pageTableEntry.valid) {
                this.updateTLB(pageNumber, pageTableEntry.frameNumber);
                return pageTableEntry.frameNumber * this.pageSize + offset;
            } else {
                console.log("Page Fault");
                this.loadPageIntoMemory(pageNumber);
                pageTableEntry = this.pageTable[pageNumber];
                this.updateTLB(pageNumber, pageTableEntry.frameNumber);
                return pageTableEntry.frameNumber * this.pageSize + offset;
            }
        }
    }

    getPhysicalAddress2Level(logicalAddress, pageSizeLevel1, pageSizeLevel2) {
        let p1 = Math.floor(logicalAddress / (pageSizeLevel1 * pageSizeLevel2));
        let temp = logicalAddress % (pageSizeLevel1 * pageSizeLevel2);
        let p2 = Math.floor(temp / pageSizeLevel2);
        let d = temp % pageSizeLevel2;

        // Simulate 2-level paging (Here we assume a simple linear address space for simplicity)
        let pageNumber = p1 * pageSizeLevel1 + p2;
        let pageTableEntry = this.pageTable[pageNumber];
        if (!pageTableEntry.valid) {
            this.loadPageIntoMemory(pageNumber);
            pageTableEntry = this.pageTable[pageNumber];
        }

        return pageTableEntry.frameNumber * pageSizeLevel2 + d;
    }

    updateTLB(pageNumber, frameNumber) {
        if (this.TLB.length >= this.tlbSize) {
            this.TLB.shift();
        }
        this.TLB.push(new TLBEntry(pageNumber, frameNumber));
    }

    loadPageIntoMemory(pageNumber) {
        if (this.frameCounter >= this.numFrames) {
            this.replacePage(pageNumber);
        } else {
            this.pageTable[pageNumber].frameNumber = this.frameCounter;
            this.pageTable[pageNumber].valid = true;
            this.pageTable[pageNumber].timestamp = Date.now();
            this.frames[this.frameCounter] = pageNumber;
            this.frameCounter++;
        }
    }

    replacePage(pageNumber) {
        let frameToReplace = this.frames.shift();
        let oldPageNumber = this.pageTable.findIndex(entry => entry.frameNumber === frameToReplace);
        this.pageTable[oldPageNumber].valid = false;
        this.pageTable[pageNumber].frameNumber = frameToReplace;
        this.pageTable[pageNumber].valid = true;
        this.pageTable[pageNumber].timestamp = Date.now();
        this.frames.push(pageNumber);
    }

    printPageTable() {
        let tableBody = document.querySelector("#pageTable tbody");
        tableBody.innerHTML = "";
        this.pageTable.forEach(entry => {
            let row = `<tr>
                <td>${entry.pageNumber}</td>
                <td>${entry.frameNumber}</td>
                <td>${entry.valid}</td>
                <td>${entry.timestamp}</td>
            </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    simulatePageReplacement(pages, algorithm) {
        let pageFaults = 0;
        pages.forEach(pageNumber => {
            if (!this.pageTable[pageNumber].valid) {
                pageFaults++;
                if (this.frameCounter >= this.numFrames) {
                    this.replacePage(pageNumber);
                } else {
                    this.pageTable[pageNumber].frameNumber = this.frameCounter;
                    this.pageTable[pageNumber].valid = true;
                    this.pageTable[pageNumber].timestamp = Date.now();
                    this.frames[this.frameCounter] = pageNumber;
                    this.frameCounter++;
                }
            }
        });
        console.log(`Page Faults using ${algorithm}: ${pageFaults}`);
    }
}

let mmu = new MemoryManagementUnit(64, 16, 1024);

function translateAddress() {
    let logicalAddress = parseInt(document.getElementById("logicalAddress").value);
    if (isNaN(logicalAddress) || logicalAddress < 0) {
        alert("Please enter a valid logical address.");
        return;
    }
    let physicalAddress = mmu.getPhysicalAddress(logicalAddress);
    document.getElementById("output").innerText = "Physical Address: " + physicalAddress;
    mmu.printPageTable();
}

function translateAddress2Level() {
    let logicalAddress = parseInt(document.getElementById("logicalAddress").value);
    if (isNaN(logicalAddress) || logicalAddress < 0) {
        alert("Please enter a valid logical address.");
        return;
    }
    let physicalAddress = mmu.getPhysicalAddress2Level(logicalAddress, 4, 256);
    document.getElementById("output").innerText = "Physical Address (2-Level): " + physicalAddress;
    mmu.printPageTable();
}

function simulatePageReplacement() {
    let pages = document.getElementById("pages").value.split(',').map(Number);
    let algorithm = document.getElementById("algorithm").value;
    mmu.simulatePageReplacement(pages, algorithm);
    mmu.printPageTable();
}
