let label = [];
let tr_height = $("tr").height();
let mips_table_element = $("#mips_table_panel");
let delta = $("#mips_table").offset().top-mips_table_element.offset().top;
let panel_height = mips_table_element.height();
function translatePseudo(inst_arr){
    "use strict";
    for (let i = 0; i < inst_arr.length; i++)
    {
        if (inst_arr[i].slice(0,4).toLowerCase() === "move") inst_arr[i] = "add"+inst_arr[i].slice(4)+",$zero";
        if (inst_arr[i].slice(0,3).toLowerCase() === "nop") inst_arr[i] = "sll $zero,$zero,0";
    }
    return inst_arr;
}

/**
 * @return {string}
 */
function Dec2Hex(value) {
    "use strict";
    let temp = Number(value);
    if (temp < 0) temp += 4294967296;
    let ans = "";
    if (isNaN(temp)) throw new Error("In function Dec2Hex:  the input parameter doesn't agree with the decimal number format!");
    for (let i = 0; i < 8; i++)
    {
        if (temp%16 <= 9 && temp%16 >= 0) ans = String(temp%16) + ans;
        else ans = Dec2Hex_Code[temp%16] + ans;
        temp = Math.floor(temp/16);
    }
    return "0x"+ans;
}
/**
 * @return {string}
 */
function Dec2Bin(value, digits) {
    let temp = parseInt(value);
    if (isNaN(temp)) throw new Error("In function Dec2Bin:  the input parameter doesn't agree with the decimal number format!");
    if (temp < 0) temp += 4294967296;
    let ans = "";
    while (temp !== 0)
    {
        ans = (temp % 2) + ans;
        temp = Math.floor(temp / 2);
    }
    if (digits > ans.length)
    {
        let temp_arr = new Array(digits - ans.length).fill("0");
        ans = temp_arr.join("") + ans;
    }
    else if (digits < ans.length) ans = ans.slice(ans.length - digits);
    return ans;
}

/**
 * @return {number}
 */
function Bin2Dec(str) {
    let temp, ans = 0;
    for (let i = 0; i < str.length; i++)
    {
        if (str[i] !== "1" && str[i] !== "0") throw new Error("In function Bin2Dec: the input parameter doesn't agree with the binary number format!");
        temp = (str[i] === "1") ? 1 : 0;
        ans = ans * 2 + temp;
    }
    return ans;
}

/**
 * @return {string}
 */
function Hex2Bin(str) {
    let ans = "";
    str = str.toLowerCase();
    for (let i = 0; i < str.length; i++)
        ans += Hex_Code[str[i]];
    return ans;
}

/**
 * @return {string}
 */
function Bin2Hex(str) {
    "use strict";
    let ans = "";
    while (str.length % 4 !== 0) str = str[0]+str;
    for (let i = 0; i < 8; i++)
    {
        let pair = Object.entries(Hex_Code).filter(x => x[1] === str.slice(4 * i, 4 * i + 4));
        if (pair === []) throw new Error("In function Bin2Hex: the input parameter doesn't agree with the hexadecimal number format!");
        ans = ans + pair[0][0];
    }
    return ans;
}
const Inst_name = {
    R_type: {
        "add": "100000",
        "sub": "100010",
        "and": "100100",
        "or": "100101",
        "sll": "000000",
        "srl": "000010",
        "slt": "101010",
        "jr": "001000",
        "nor":"100111",
        "xor":"100110",
        "sra":"000011",
        "sllv":"000100",
        "srlv":"000110",
        "srav":"000111"
    },
    I_type: {
        "addi": "001000",
        "ori": "001101",
        "lw": "100011",
        "sw": "101011",
        "lui": "001111",
        "slti": "001010",
        "beq": "000100",
        "bne": "000101",
        "andi":"001100",
        "xori":"001110"
    },
    J_type: {"j": "000010", "jal": "000011"}
};
const Register = ["$zero", "$at", "$v0", "$v1", "$a0", "$a1", "$a2", "$a3", "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7", "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7", "$t8", "$t9", "$k0", "$k1", "$gp", "$sp", "$fp", "$ra"];
const Hex_Code = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    "a": "1010",
    "b": "1011",
    "c": "1100",
    "d": "1101",
    "e": "1110",
    "f": "1111"
};
const Dec2Hex_Code = {
    10:"a",
    11:"b",
    12:"c",
    13:"d",
    14:"e",
    15:"f"
};
let vm = new Vue({
    el: "#mips",
    data: {
        mips_code: "",
        binary_code: "",
        mips_inst: [],
        mips_inst_display: [],
        inst_num: 0,
        binary_inst: [],
        radix: 16,
        coe:true,
        fimport:"Mips",
        fexport:"Raw",
        mode:true,
        v_reg:Register,
        rformat:10,
        lock:false,
        RegValue:new Array(32).fill(0),
        PC:0,
        imm:0,
        rdReg:-1,
        rsReg:-1,
        rtReg:-1,
        immActive:false,
        memory:[]
    },
    watch:{
        fimport(newVal,oldVal)
        {
            "use strict";
            if (newVal !== oldVal)
            {
                if (newVal === "Mips") this.fexport = "Raw";
                else this.fexport = "Mips";
            }
        },
        fexport(newVal,oldVal)
        {
            "use strict";
            if (newVal !== oldVal)
            {
                if (newVal === "Mips") this.fimport = "Raw";
                else this.fimport = "Mips";
            }
        },
        mode(newVal){
            "use strict";
            if (String(newVal) === "true") this.lock = false;
            this.radix = 2;
            this.coe = false;
            this.fimport = "Mips";
        }
    },
    computed:{
        reg_value:function(){
            "use strict";
            if (Number(this.rformat) === 10) return this.RegValue.map(x => String(x));
            else return this.RegValue.map(x => Dec2Hex(x));
        },
        /**
         * @return {string}
         */
        PC_value:function(){
            "use strict";
            if (Number(this.rformat) === 10) return String(4*this.PC);
            else return Dec2Hex(4*this.PC);
        },
        imm_value:function(){
            "use strict";
            if (Number(this.rformat) === 10) return String(this.imm);
            else return Dec2Hex(this.imm);
        }
    },
    methods: {
        getLines:function(){
            "use strict";
            this.formatMips();
            this.mips_code = "";
            for (let i = 0; i < this.mips_inst.length; i++)
                this.mips_code += this.mips_inst[i]+"\t\t; Line"+i+"\n";
        },
        executeAll:function(){
            "use strict";
            let maxStep = 10000;
            while (maxStep > 0 && this.PC < this.inst_num)
            {
                this.executeOneInst(this.binary_inst[this.PC]);
                maxStep--;
            }
            if (maxStep <= 0) displayErr(new Error("There is a loop in this program!"));
        },
        executeOneInst:function(bin){
            "use strict";
            this.immActive = false;
            let inst, rs, rt, rd, shamt, imm;
            let code = bin.substring(0, 6);
            if (code === "000000")
            {
                code = bin.slice(-6);
                let pair = Object.entries(Inst_name.R_type).filter(x => x[1] === code);
                inst = pair[0][0];
                this.rtReg = this.rsReg = this.rdReg = -1;
                rs = Bin2Dec(bin.slice(6, 11));
                rt = Bin2Dec(bin.slice(11, 16));
                rd = Bin2Dec(bin.slice(16, 21));
                shamt = Bin2Dec(bin.slice(21, 26));
                this.imm = shamt;
                if (inst !== "jr") this.PC += 1;
                switch (inst)
                {
                    case "add":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rs] + this.RegValue[rt]);
                        break;
                    case "sub":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rs] - this.RegValue[rt]);
                        break;
                    case "and":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rs] & this.RegValue[rt]);
                        break;
                    case "or":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rs] | this.RegValue[rt]);
                        break;
                    case "sll":
                        this.immActive = true;
                        this.rdReg = rd; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] << shamt);
                        break;
                    case "srl":
                        this.immActive = true;
                        this.rdReg = rd; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] >>> shamt);
                        break;
                    case "sra":
                        this.immActive = true;
                        this.rdReg = rd; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] >> shamt);
                        break;
                    case "slt":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,(this.RegValue[rs] < this.RegValue[rt]) ? 1 : 0);
                        break;
                    case "nor":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,~(this.RegValue[rs] | this.RegValue[rt]));
                        break;
                    case "xor":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rs] ^ this.RegValue[rt]);
                        break;
                    case "sllv":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] << this.RegValue[rs]);
                        break;
                    case "srlv":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] >>> this.RegValue[rs]);
                        break;
                    case "srav":
                        this.rdReg = rd; this.rsReg = rs; this.rtReg = rt;
                        this.$set(this.RegValue,rd,this.RegValue[rt] >> this.RegValue[rs]);
                        break;
                    case "jr":
                        this.rsReg = rs;
                        this.PC = Math.floor(Number(this.RegValue[rs])/4);
                        break;
                }
            }
            else if (code === "000010" || code === "000011") //put it last
            {
                if (code === "000010") inst = "j";
                else inst = "jal";
                let imm = bin.slice(6, 32);
                this.imm = Bin2Dec(imm);
                let tempStr = Dec2Bin(4*this.PC+4,32);
                tempStr = tempStr.slice(0,4)+imm+"00";
                console.log(tempStr);
                if (inst === "jal")
                {
                    this.RegValue[31] = 4*this.PC+4;
                    this.rdReg = 31;
                }
                this.PC = Math.floor(Bin2Dec(tempStr)/4);
            }
            else
            {
                let pair = Object.entries(Inst_name.I_type).filter(x => x[1] === code);
                console.log(code);
                inst = pair[0][0];
                rs = Bin2Dec(bin.slice(6, 11));
                rt = Bin2Dec(bin.slice(11, 16));
                this.imm = Bin2Dec(bin.slice(16));
                this.immActive = true;
                if (this.imm > 32767) this.imm -= 65536;
                if (inst !== "beq" && inst !== "bne") this.PC += 1;
                switch (inst)
                {
                    case "addi":
                        this.rsReg = rs; this.rdReg = rt;
                        this.$set(this.RegValue,rt,this.RegValue[rs]+this.imm); break;
                    case "ori":
                        this.rsReg = rs; this.rdReg = rt;
                        this.$set(this.RegValue,rt,this.RegValue[rs]|this.imm); break;
                    case "lw":
                        this.rsReg = rs; this.rdReg = rt;
                        let ans = this.memory[this.RegValue[rs]+this.imm];
                        if (ans === undefined) ans = 0;
                        this.$set(this.RegValue,rt,ans);
                        break;
                    case "sw":
                        this.rsReg = rs; this.rdReg = rt;
                        this.memory[this.RegValue[rs]+this.imm] = this.RegValue[rt];
                        break;
                    case "lui":
                        this.rdReg = rt;this.$set(this.RegValue,rt,this.imm*65536); break;
                    case "slti":
                        this.rsReg = rs; this.rdReg = rt;
                        this.$set(this.RegValue,rt,(this.RegValue[rs]<this.imm)?1:0); break;
                    case "beq":
                        this.rsReg = rs; this.rdReg = rt;
                        if (this.RegValue[rs] === this.RegValue[rt]) this.PC = this.PC+1+this.imm;
                        else this.PC = this.PC+1;
                        break;
                    case "bne":
                        this.rsReg = rs; this.rdReg = rt;
                        if (this.RegValue[rs] !== this.RegValue[rt]) this.PC = this.PC+1+this.imm;
                        else this.PC = this.PC+1;
                        break;
                    case "andi":
                        this.rsReg = rs; this.rdReg = rt;
                        this.$set(this.RegValue,rt,this.RegValue[rs]&this.imm); break;
                    case "xori":
                        this.rsReg = rs; this.rdReg = rt;
                        this.$set(this.RegValue,rt,this.RegValue[rs]^this.imm); break;
                }
            }
            this.RegValue[0] = 0;
        },
        check:function(){
            "use strict";
            try{
                this.encode();
                swal("Good!", "No grammar mistake!", "success");
            }catch(err){
                displayErr(err);
            }
        },
        formatMips:function(){
            "use strict";
            label = [];
            this.mips_code = this.mips_code.replace(/[;#].*/g,"\n");
            this.mips_code = this.mips_code.replace(/\t/g," ");
            this.mips_inst = this.mips_code.split("\n").map(x => x.trim()).filter(x => x !== "");
            this.mips_inst = translatePseudo(this.mips_inst);
            for (let i = this.mips_inst.length - 1; i >= 0; i--)
            {
                let temp_string = this.mips_inst[i];
                if (temp_string[temp_string.length - 1] === ":")
                    if (i < this.mips_inst.length - 1)
                    {
                        this.mips_inst[i] = this.mips_inst[i] + " " + this.mips_inst[i + 1];
                        this.mips_inst[i + 1] = "";
                    }
            }
            this.mips_inst = this.mips_inst.map(x => x.trim()).filter(x => x !== "");
            for (let i = 0; i < this.mips_inst.length; i++)
            {
                let position = this.mips_inst[i].indexOf(":");
                if (position !== -1)
                {
                    label[this.mips_inst[i].substring(0, position)] = i;
                    position = this.mips_inst[i].indexOf(":");
                }
            }
        },
        one_step:function(){
            "use strict";
            if (this.PC < this.inst_num)
            {
                this.executeOneInst(this.binary_inst[this.PC]);
            }
            if (panel_height-(this.PC+1)*tr_height-delta < 0) $("#mips_table_panel").scrollTop((this.PC+2)*tr_height+2*delta-panel_height);
            else $("#mips_table_panel").scrollTop(0);
        },
        reinit:function () {
            "use strict";
            $("#mips_table_panel").scrollTop(0);
            for (let i = 0; i < 32; i++) this.$set(this.RegValue,i,0);
            this.PC = this.imm = 0;
            this.rdReg = this.rtReg = this.rsReg = -1;
        },
        submit: function(){
            "use strict";
            try{
                this.formatMips();
                this.reinit();
                this.mips_inst_display = this.mips_inst.map(x => {
                    for (let i = 0; i < 32; i++)
                        x = x.replace(new RegExp("\\"+Register[i],"g"),'<span class="registerSpan">'+Register[i]+'</span>');
                    let label_arr = Object.entries(label);
                    let R_arr = Object.entries(Inst_name.R_type);
                    let I_arr = Object.entries(Inst_name.I_type);
                    let J_arr = Object.entries(Inst_name.J_type);
                    for (let i = 0; i < label_arr.length; i++)
                        x = x.replace(new RegExp(label_arr[i][0],"g"),'<span class="labelSpan">'+label_arr[i][0]+'</span>');
                    for (let i = 0; i < R_arr.length; i++)
                        x = x.replace(new RegExp(R_arr[i][0],"g"),'<span class="instSpan">'+R_arr[i][0]+'</span>');
                    for (let i = 0; i < I_arr.length; i++)
                        x = x.replace(new RegExp(I_arr[i][0],"g"),'<span class="instSpan">'+I_arr[i][0]+'</span>');
                    for (let i = 0; i < J_arr.length; i++)
                        x = x.replace(new RegExp(J_arr[i][0],"g"),'<span class="instSpan">'+J_arr[i][0]+'</span>');
                    return x;
                });
                let backup = this.binary_code;
                this.encode();
                this.binary_code = backup;
                this.lock = !this.lock;
            }catch(err){
                if (this.lock) this.lock = !this.lock;
                displayErr(err);
            }
        },
        decode_outer: function(){
            "use strict";
            try{
                this.decode();
            }
            catch (err){
                displayErr(err);
            }
        },
        encode_outer: function () {
            "use strict";
            try{
                this.encode();
            }
            catch (err){
                displayErr(err);
            }
        },
        decode: function () {
            label = [];
            bin_code = this.binary_code.replace(/[,.;]/g,"\n").toLowerCase();
            if (String(this.coe) === "true") bin_code = bin_code.replace(/m.*/g,"");
            this.binary_inst = bin_code.split("\n").map(x => x.trim()).filter(x => x !== "");
            if (Number(this.radix) === 2)
                if (bin_code.replace(/[ \t\n]/g,"").split("").every(x => x === "0" || x === "1"))
                {
                    this.inst_num = this.binary_inst.length;
                    this.mips_inst = new Array(this.inst_num).fill("");
                    for (let i = 0; i < this.inst_num; i++)
                        this.mips_inst[i] += this.Bin2Mips(this.binary_inst[i], i);
                    this.mips_code = this.mips_inst.join("\n");
                }
                else throw new Error("In function decode: the input parameter doesn't agree with the binary number format!");
            else if (Number(this.radix) === 16)
            {
                if (bin_code.replace(/[ \n\t]/g,"").split("").every(x => x in Hex_Code))
                {
                    this.inst_num = this.binary_inst.length;
                    this.mips_inst = new Array(this.inst_num).fill("");
                    for (let i = 0; i < this.inst_num; i++)
                        this.mips_inst[i] += this.Bin2Mips(Hex2Bin(this.binary_inst[i]), i);
                    this.mips_code = this.mips_inst.join("\n");
                }
                else throw new Error("In function decode: the input parameter doesn't agree with the hexadecimal number format!");
            }
        },
        /**
         * @return {string}
         */
        Bin2Mips: function (bin, line) {
            let inst, rs, rt, rd, shamt, imm;
            code = bin.substring(0, 6);
            if (code === "000000")
            {
                code = bin.slice(-6);
                let pair = Object.entries(Inst_name.R_type).filter(x => x[1] === code);
                if (pair.length !== 0)
                {
                    inst = pair[0][0];
                    rs = Register[Bin2Dec(bin.slice(6, 11))];
                    rt = Register[Bin2Dec(bin.slice(11, 16))];
                    rd = Register[Bin2Dec(bin.slice(16, 21))];
                    //if (isNaN(rs+rt+rd)) throw new Error("In function Bin2Mips: the register parameter is invalid!");
                    shamt = Bin2Dec(bin.slice(21, 26));
                    if (inst !== "sll" && inst !== "srl" && inst !== "jr") return inst + " " + [rd, rs, rt].join(",");
                    else if (inst === "sll" || inst === "srl" || inst === "sra") return inst + " " + [rd, rt, shamt].join(",");
                    else if (inst === "jr") return inst + " " + rs;
                }
                else throw new Error("In line "+line+": \n \n The function code is invalid!");  //otherwise, the R-type instruction is invalid.
            }
            else if (code === "000010" || code === "000011") //put it last
            {
                if (code === "000010") inst = "j";
                else inst = "jal";
                imm = Bin2Dec(bin.slice(6, 32));
                if (imm <= this.inst_num && imm >= 0)
                {
                    if (label.find(x => x === imm) === undefined) this.mips_inst[imm] = "L" + (label.push(imm) - 1) + ": " + this.mips_inst[imm];
                    return inst + " " + "L" + label.findIndex(x => x === imm);
                }
                else throw new Error("In line "+line+": \n \n The address is out of range!");
            }
            else
            {
                let pair = Object.entries(Inst_name.I_type).filter(x => x[1] === code);
                if (pair.length !== 0)
                {
                    inst = pair[0][0];
                    rs = Register[Bin2Dec(bin.slice(6, 11))];
                    rt = Register[Bin2Dec(bin.slice(11, 16))];
                    imm = Bin2Dec(bin.slice(16));
                    if (imm > 32767) imm -= 65536;
                    if (inst !== "lw" && inst !== "sw" && inst !== "lui" && inst !== "beq" && inst !== "bne") return inst + " " + [rt, rs, imm].join(",");
                    else if (inst === "lui") return inst + " " + [rt, imm].join(",");
                    else if (inst === "lw" || inst === "sw") return inst + " " + [rt, imm + "(" + rs + ")"].join(",");
                    else if (inst === "beq" || inst === "bne")
                    {
                        let position = line + 1 + imm;
                        if (position <= this.inst_num && position >= 0)
                        {
                            if (label.find(x => x === position) === undefined) this.mips_inst[position] = "L" + (label.push(position) - 1) + ": " + this.mips_inst[position];
                            return inst + " " + [rs, rt, "L" + label.findIndex(x => x === position)].join(",");
                        }
                        else throw new Error("In line "+line+": \n \n The address is out of range!");
                    }
                }
                else throw new Error("In line "+line+": \n \n The instruction code is undefined!");
            }
        },
        encode: function () {
            this.formatMips();
            this.mips_code = this.mips_inst.join("\n");
            for (let i = 0; i < this.mips_inst.length; i++)
            {
                let position = this.mips_inst[i].indexOf(":");
                if (position !== -1) this.mips_inst[i] = this.mips_inst[i].substring(position + 1);
            }
            this.mips_inst = this.mips_inst.map(x => x.trim()).filter(x => x !== "");
            this.inst_num = this.mips_inst.length;
            this.binary_inst = [];
            if (Number(this.radix) === 2)
                for (let i = 0; i < this.inst_num; i++)
                    this.binary_inst.push(this.Mips2Bin(this.mips_inst[i], i));
            else if (Number(this.radix) === 16)
                for (let i = 0; i < this.inst_num; i++)
                    this.binary_inst.push(Bin2Hex(this.Mips2Bin(this.mips_inst[i], i)));
            if (String(this.coe) === "true") this.binary_code = ["memory_initialization_radix="+this.radix+";\n","memory_initialization_vector=\n",this.binary_inst.join(", "),";"].join("");
            else this.binary_code = this.binary_inst.join("\n");
        },
        /**
         * @return {string}
         */
        Mips2Bin: function (mips, line) {
            let code = mips.split(' ');
            let inst = code[0].toLowerCase();
            let other = "";
            for (let i = 1; i < code.length; i++) other += code[i].trim();
            if (Object.keys(Inst_name.R_type).find((value) => value === inst) !== undefined)
            {
                let ans = Inst_name.R_type[inst];
                if (inst !== "sll" && inst !== "srl" && inst !== "sra" && inst !== "jr")
                {
                    let parameter = other.toLowerCase().split(",").map(x => {
                        let ans = Register.findIndex((value, index) => value === x);
                        if (ans === -1) return null;
                        return Dec2Bin(ans,5);
                    });
                    if (isNaN(parameter[0]+parameter[1]+parameter[2])) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    return "000000" + parameter[1] + parameter[2] + parameter[0] + "00000" + ans;
                }
                else if (inst !== "jr")
                {
                    let temp = other.toLowerCase().split(",");
                    let parameter = [temp[0], temp[1]].map(x => {
                            let ans = Register.findIndex((value, index) => value === x);
                            if (ans === -1) return null;
                            return Dec2Bin(ans,5);
                    });
                    if (Number(temp[2]) > 31) throw new Error("In line "+line+": \n \n Invalid parameter for shift operation!");
                    if (isNaN(parameter[0]+parameter[1])) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    return "000000" + "00000" + parameter[1] + parameter[0] + Dec2Bin(temp[2], 5) + ans;
                }
                else
                {
                    let temp = Register.findIndex((value, index) => value === other.toLowerCase());
                    if (temp === -1) throw new Error("In line "+line+": \n \n Invalid register parameter for operation!");
                    temp = Dec2Bin(temp, 5);
                    return "000000" + temp + "00000" + "00000" + "00000" + ans;
                }
            }
            else if (Object.keys(Inst_name.I_type).find((value) => value === inst) !== undefined)
            {
                let ans = Inst_name.I_type[inst];
                if (inst !== "lw" && inst !== "sw" && inst !== "lui" && inst !== "beq" && inst !== "bne")
                {
                    let temp = other.toLowerCase().split(",");
                    let parameter = [temp[0], temp[1]].map(x => {
                        let ans = Register.findIndex((value, index) => value === x);
                        if (ans === -1) return null;
                        return Dec2Bin(ans,5);
                    });
                    if (Number(temp[2]) >= 131072) throw new Error("In line "+line+": \n \n Invalid number for immediate number!");
                    if (isNaN(parameter[0]+parameter[1])) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    return ans + parameter[1] + parameter[0] + Dec2Bin(temp[2], 16);
                }
                else if (inst === "lui")
                {
                    let temp = other.toLowerCase().split(",");
                    let parameter1 = Register.findIndex((value, index) => value === temp[0]);
                    if (parameter1 === -1) parameter1 = null; else parameter1 = Dec2Bin(parameter1, 5);
                    let parameter2 = Dec2Bin(temp[1], 16);
                    if (isNaN(parameter1+parameter2)) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    return ans + "00000" + parameter1 + parameter2;
                }
                else if (inst === "lw" || inst === "sw")
                {
                    let temp = other.toLowerCase().split(/[,()]/).filter(x => x !== "");
                    let parameter1 = Register.findIndex((value, index) => value === temp[0]);
                    if (parameter1 === -1) parameter1 = null; else parameter1 = Dec2Bin(parameter1, 5);
                    let parameter2 = Dec2Bin(temp[1], 16);
                    if (Number(temp[1]) >= 131072) throw new Error("In line "+line+": \n \n Invalid number for immediate number!");
                    if (Number(temp[1]) % 4 !== 0) throw new Error("In line "+line+": \n \n Invalid number for load/store word operation!");
                    let parameter3 = Register.findIndex((value, index) => value === temp[2]);
                    if (parameter3 === -1) parameter3 = null; else parameter3 = Dec2Bin(parameter3, 5);
                    if (isNaN(parameter1+parameter2+parameter3)) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    return ans + parameter3 + parameter1 + parameter2;
                }
                else if (inst === "beq" || inst === "bne")
                {
                    let temp = other.split(",");
                    let parameter = [temp[0].toLowerCase(), temp[1].toLowerCase()].map(x => Dec2Bin(Register.findIndex((value, index) => value === x), 5));
                    if (label[temp[2]] === undefined) throw new Error("In line "+line+": \n \n The label is invalid!");
                    if (isNaN(parameter[0]+parameter[1])) throw new Error("In line "+line+": \n \n The input parameter is invalid!");
                    else return ans + parameter[0] + parameter[1] + Dec2Bin(label[temp[2]] - line - 1, 16);
                }
            }
            else if (Object.keys(Inst_name.J_type).find((value) => value === inst) !== undefined)
            {
                let temp = other;
                let ans = Inst_name.J_type[inst];
                if (label[temp] === undefined) throw new Error("In line "+line+": \n \n The label is invalid!");
                return ans + Dec2Bin(label[temp], 26);
            }
            else throw new Error("In line "+line+": \n \n The instruction is undefined!");
        }
    }
});


