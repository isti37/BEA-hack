// npm i memoryjs asynckeystate jsonfile sleep opener express socket.io request
/*
If you have any question:
    http://www.unknowncheats.me/forum/counterstrike-global-offensive/186350-node-js-hack-glow-skinchanger-radar-basic-web-gui.html
*/
var memory = require('memoryjs'),
    keyboard = require("asynckeystate"),
    sleep = require('sleep'),
    jsonfile = require('jsonfile'),
    open = require('opener'),
    request = require('request'),
    localVersion = require('./version.json'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    main = {
        DwLocalPlayer: null,
        LocalPlayerTeam: null,
        DwGlowObjectManager: null
    },
    master = {},
    versionLoaded = false;

main.checkForUpdate = function(callback){
    request.get('https://raw.githubusercontent.com/s-gto/BEA-hack/master/version.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            master = JSON.parse(body);  
            console.log(master);
            if(localVersion.version < master.version)
                console.log("Your version is outdated, please update it from https://github.com/s-gto/BEA-hack");
            else if(localVersion.offsets < master.offsets){
                console.log("offsets are updated");
                masterOffsets = main.getJson('https://raw.githubusercontent.com/s-gto/BEA-hack/master/offsets.json');
                offsets = masterOffsets;
                localVersion.offsets = master.offsets;
                jsonfile.writeFile("./offsets.json", masterOffsets);
                jsonfile.writeFile("./version.json", localVersion);
            }
            callback();
        }
    });
};
main.getProcess = function(){
    memory.openProcess("csgo.exe",function(err,process){
        if(err != null && err == "unable to find process"){
            io.emit("hacked",false);
            return false;
        }else{
            try{
                var clientModule = memory.findModule("client.dll", process.th32ProcessID);
                if(!hacked){
                    console.log("CSGO found. initizalizing hack.");
                    memory.findModule("client.dll", process.th32ProcessID,function(err,module){
                        var clientModule = module;
                        DwClientDllBaseAddress = clientModule.modBaseAddr;
                        io.emit("hacked",true);
                        hacked = true;
                    });
                    var engineModule = memory.findModule("engine.dll", process.th32ProcessID);
                    DwEngineDllBaseAddress = engineModule.modBaseAddr;
                }
            }catch(e){
                if(hacked){
                    hacked = false;
                    console.log("CSGO Closed.");
                    io.emit("hacked",false);
                    clearInterval(_getProcess);
                    _getProcess = setInterval(main.getProcess,1000);
                }
            }
        }
    });
};
main.getOffset = function(name){
    return parseInt(offsets[name]);
};
main.setConfig = function(data){
    config.settings[data.data] = data.value;
    jsonfile.writeFile("./config.json", config);
}
main.saveConfig = function(data){
    config = data;
    jsonfile.writeFile("./config.json", config);
}
main.stop = function(){
    clearInterval(_trigger);
    clearInterval(_glow);
    clearInterval(_radar);
    clearInterval(_flash);
    clearInterval(_bunnyhop);
    clearInterval(_skins);
}
main.start = function(){
    main.DwGlowObjectManager = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwGlowObject"),"int");
    _trigger = setInterval(function(){
        if(config.settings.trigger){
            hack.trigger();
        }
    },5);
    _glow = setInterval(function(){
        if(config.settings.glow){
            hack.glow.start();
        }
    },20);
    _radar = setInterval(function(){
        if(config.settings.radar){
            hack.radar();
        }
    },20);
    _flash = setInterval(function(){
        if(config.settings.flash){
            hack.noflash();
        }
    },2);
    _bunnyhop = setInterval(function(){
        if(config.settings.bunnyhop){
            hack.bunnyhop();
        }
    },5);
    _skins = setInterval(function(){
        if(config.settings.skins){
            hack.skinchanger.skins();
        }
    },10);
    setInterval(function(){
        if(keyboard.getAsyncKeyState(0x70) && !_updating)
            hack.skinchanger.update();
    },10);
};
var hack = {};
    hack.glow = {};
    hack.skinchanger = {};
hack.trigger = function(){

    var DwLocalPlayer = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    var LocalPlayerTeam = memory.readMemory(DwLocalPlayer + main.getOffset("m_iTeamNum"),"int");
    var iCrosshair = memory.readMemory(DwLocalPlayer + main.getOffset("m_iCrossHairID"),"int");
    var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( iCrosshair - 1) * main.getOffset("m_entLoopDist"),"int");
    var iEntityHealth = memory.readMemory(dwEntity + main.getOffset("m_iHealth"),"int");
    var iEntityTeam = memory.readMemory(dwEntity + main.getOffset("m_iTeamNum"),"int");
    if (LocalPlayerTeam != iEntityTeam && iEntityHealth > 0 && iCrosshair >= 1 && iCrosshair < 65){
        if (keyboard.getAsyncKeyState(parseInt(config.settings.trigger_key))){
            sleep.usleep(parseInt(config.settings.trigger_delay));
            memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceAttack"), 5, "int");
            sleep.usleep(5);
            if(!keyboard.getAsyncKeyState(0x01))
                memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceAttack"), 4, "int");
        }
    }
};
hack.radar = function(){
        for (var i = 1; i < 65; i++){
            var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( i - 1) * main.getOffset("m_entLoopDist"),"int");
            memory.writeMemory(dwEntity + main.getOffset("m_bSpotted"), 1, "int");
        }
};
hack.glow.start = function(){
    var DwLocalPlayer = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    var LocalPlayerTeam = memory.readMemory(DwLocalPlayer + main.getOffset("m_iTeamNum"),"int");
    for (var i = 1; i < 65; i++){
        var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( i - 1) * main.getOffset("m_entLoopDist"),"int");
        var iEntityTeam = memory.readMemory(dwEntity + main.getOffset("m_iTeamNum"),"int");
        var bEntityDormant = memory.readMemory(dwEntity + main.getOffset("m_bDormant"),"int");
        if (!bEntityDormant)
        {
            var iGlowIndex = memory.readMemory(dwEntity + main.getOffset("m_iGlowIndex"),"int");
            if (iEntityTeam == LocalPlayerTeam){
                hack.glow.setGlow(iGlowIndex, 0, 1, 0, 0.5);
            }
            else 
                hack.glow.setGlow(iGlowIndex, 1, 0, 0, 0.5);
        }
    }
};
hack.glow.setGlow = function(iEntityGlowIndex, r, g, b, a){
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x4), r, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x8), g, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0xC), b, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x10), a, "float");

    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x24), 1, "bool");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x25), 0, "bool");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x26), 0, "bool");
};
hack.noflash = function(){
    var DwLocalPlayer = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    var flashMaxAlpha = memory.readMemory(DwLocalPlayer + main.getOffset("m_flFlashMaxAlpha"), "float");
 
    if (flashMaxAlpha > 0.0)
    {
        memory.writeMemory(DwLocalPlayer + main.getOffset("m_flFlashMaxAlpha"), 0.0, "float");
    }
};
hack.bunnyhop = function(){
    var DwLocalPlayer = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    var iFlags = memory.readMemory(DwLocalPlayer + main.getOffset("m_fFlags"), "int");
    if (keyboard.getAsyncKeyState(0x20)) 
    {
        memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceJump"), ((iFlags==257)||(iFlags==263))?5:4, "int");
    } 
};
hack.skinchanger.skins = function(){
    CBase = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    for (a = 0; a != 65; a++){
        currentWeaponIndex = memory.readMemory(CBase + main.getOffset("m_hMyWeapons") + ((a - 1) * 0x4),"int") & 0xFFF;
        currentWeaponEntity = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwEntityList") + (currentWeaponIndex - 1) * 0x10,"int");
        WeaponID = memory.readMemory(currentWeaponEntity + main.getOffset("m_iItemDefinitionIndex"),"int");   
        paintkit = memory.readMemory(currentWeaponEntity + main.getOffset("m_nFallbackPaintKit"),"int");
        myXuid = memory.readMemory(currentWeaponEntity + main.getOffset("m_OriginalOwnerXuidLow"),"int");
        if (WeaponID <= 0)
            continue;
        keys = Object.keys(config.skins);
        for( var i = 0,length = keys.length; i < length; i++ ) {
            weaponObject = config.skins[keys[i]];
            if(WeaponID == weaponObject.id && paintkit != weaponObject.paintkit){
                memory.writeMemory(currentWeaponEntity + main.getOffset("m_iItemIDLow"), 0,"int");
                memory.writeMemory(currentWeaponEntity + main.getOffset("m_iItemIDHigh"), -1,"int");
                memory.writeMemory(currentWeaponEntity + main.getOffset("m_nFallbackSeed"), weaponObject.seed,"int");
                memory.writeMemory(currentWeaponEntity + main.getOffset("m_flFallbackWear"), weaponObject.wear,"float");
                memory.writeMemory(currentWeaponEntity + main.getOffset("m_nFallbackPaintKit"), weaponObject.paintkit,"int");
            }
        }
    }
}
hack.skinchanger.update = function(){
    _updating = true;
    var pointer = memory.readMemory(DwEngineDllBaseAddress + main.getOffset("m_dwClientState"),"int");
    memory.writeMemory(pointer + main.getOffset("m_dwFullUpdate"), -1,"int");
    setTimeout(function(){
        _updating = false;
    },5);
}

var DwClientDllBaseAddress = null;
var DwEngineDllBaseAddress = null;
var _trigger,_glow,_radar,_flash,_bunnyhop,_skins,_updating,_started;
var _getProcess = null,hacked = false;
var config = require("./config.json");
var offsets = require("./offsets.json");

main.checkForUpdate(function(){
    app.use(express.static('public'));

    server.listen(80);
    app.get('/', function (req, res) {
        res.sendFile('index.html' , { root : __dirname});
    });
    server.on('listening', function() {
        open('http://localhost');
        console.log("Waiting for CSGO...");
        _getProcess = setInterval(main.getProcess,1000);
    });
    io.on('connection', function (socket) {
        
        socket.on('config change', function (data) {
            main.setConfig(data);
        });
        socket.on('config save', function (data) {
            main.saveConfig(data);
        });
        socket.on('hack', function (data) {
            if(data){
                _started = true,main.start();
            }else{
                _started = false,main.stop();
            }
        });
        config._started = _started;
        socket.emit("config", config);
        socket.emit('hacked', hacked);
        delete config._started ;
    });
});
