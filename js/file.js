$("body").on({
    drop: function (e) {
        e.preventDefault();
        let files = e.originalEvent.dataTransfer.files;
        let fr = new FileReader();
        fr.readAsText(files[0]);
        fr.onload = function (e) {
            let data = this.result;
            if (vm.fimport === "Mips") vm.mips_code = data;
            else vm.binary_code = data;
        }
    }
});

function file_download() {
    /*if (vm.fexport === "Mips") vm.decode_outer();
    else vm.encode_outer();
    console.log(vm.fexport);*/
    let filename = vm.fexport === "Mips" ? "Mips.output" : (String(vm.coe) === "true" ? "Code.coe" : "Code.output");
    let content = vm.fexport === "Mips" ? vm.mips_code : vm.binary_code;
    if (content === "") return;
    let blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    saveAs(blob, filename);
}

function file_upload() {
    "use strict";
    let data;
    let files = document.getElementById("fileup").files;
    let fr = new FileReader();
    fr.readAsText(files[0]);
    fr.onload = function (e) {
        data = this.result;
        try{
            if (String(vm.coe) === "true")
            {
                let temp = data.split(/[,;\n]/).map(x => x.trim()).filter(x => x !== "");
                if (temp[0].match(/memory_initialization_radix=[0-9]/) === null) throw new Error("In function file_upload:The format of coe file is invalid!");
                if (temp[1].match(/memory_initialization_vector=/) === null) throw new Error("In function file_upload:The format of coe file is invalid!");
            }
            if (vm.fimport === "Mips") vm.mips_code = data;
            else vm.binary_code = data;
        } catch(err)
        {
            displayErr(err);
        }
    };
}