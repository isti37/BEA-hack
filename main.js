// npm i memoryjs asynckeystate jsonfile sleep opener express socket.io
/*
If you have any question:
    http://www.unknowncheats.me/forum/counterstrike-global-offensive/186350-node-js-hack-glow-skinchanger-radar-basic-web-gui.html
*/
var memory = require('memoryjs'),
    keyboard = require("asynckeystate"),
    sleep = require('sleep'),
    jsonfile = require('jsonfile'),
    open = require('opener');

var DwClientDllBaseAddress = null;
var DwEngineDllBaseAddress = null;

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var _getProcess = null,hacked = false;

var config = jsonfile.readFileSync("./config.json");
var offsets = jsonfile.readFileSync("./offsets.json");
var main = {
    DwLocalPlayer: null,
    LocalPlayerTeam: null,
    DwGlowObjectManager: null
};
var _trigger,_glow,_radar,_flash,_bunnyhop,_skins,_updating,_started;


server.listen(80);
app.get('/', function (req, res) {
    res.sendFile('index.html' , { root : __dirname});
});
var getProcess = function(){
    memory.openProcess("csgo.exe",function(err,process){
        if(err != null && err == "unable to find process"){
            io.emit("hooked",false);
            return false;
        }else{
            try{
                var clientModule = memory.findModule("client.dll", process.th32ProcessID);
                if(!hacked){
                    console.log("CSGO found. initizalizing hook.");
                    memory.findModule("client.dll", process.th32ProcessID,function(err,module){
                        var clientModule = module;
                        DwClientDllBaseAddress = clientModule.modBaseAddr;
                        io.emit("hooked",true);
                        hacked = true;
                    });
                    var engineModule = memory.findModule("engine.dll", process.th32ProcessID);
                    DwEngineDllBaseAddress = engineModule.modBaseAddr;
                }
            }catch(e){
                if(hacked){
                    hacked = false;
                    console.log("CSGO Closed.");
                    io.emit("hooked",false);
                    clearInterval(_getProcess);
                    _getProcess = setInterval(getProcess,1000);
                }
            }
        }
    });
};
server.on('listening', function() {
    open('http://localhost');
    console.log("Waiting for CSGO...");
    _getProcess = setInterval(getProcess,1000);
});
io.on('connection', function (socket) {
    
    socket.on('config change', function (data) {
        main.setConfig(data);
    });
    socket.on('config save', function (data) {
        main.saveConfig(data);
    });
    socket.on('hook', function (data) {
        if(data){
            _started = true,main.start();
        }else{
            _started = false,main.stop();
        }
    });
    config._started = _started;
    socket.emit("config", config);
    socket.emit('hooked', hacked);
    delete config._started ;
});

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
    main.DwLocalPlayer = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwLocalPlayer"),"int");
    main.LocalPlayerTeam = memory.readMemory(main.DwLocalPlayer + main.getOffset("m_iTeamNum"),"int");
    main.DwGlowObjectManager = memory.readMemory(DwClientDllBaseAddress + main.getOffset("m_dwGlowObject"),"int");
    _trigger = setInterval(function(){
        if(config.settings.trigger){
            hook.trigger();
        }
    },5);
    _glow = setInterval(function(){
        if(config.settings.glow){
            hook.glow.start();
        }
    },20);
    _radar = setInterval(function(){
        if(config.settings.radar){
            hook.radar();
        }
    },20);
    _flash = setInterval(function(){
        if(config.settings.flash){
            hook.noflash();
        }
    },2);
    _bunnyhop = setInterval(function(){
        if(config.settings.bunnyhop){
            hook.bunnyhop();
        }
    },5);
    _skins = setInterval(function(){
        if(config.settings.skins){
            hook.skinchanger.skins();
        }
    },10);
    setInterval(function(){
        if(keyboard.getAsyncKeyState(0x70) && !_updating)
            hook.skinchanger.update();
    },10);
};

var hook = {};
    hook.glow = {};
    hook.skinchanger = {};
hook.trigger = function(){
    var iCrosshair = memory.readMemory(main.DwLocalPlayer + main.getOffset("m_iCrossHairID"),"int");
    var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( iCrosshair - 1) * main.getOffset("m_entLoopDist"),"int");
    var iEntityHealth = memory.readMemory(dwEntity + main.getOffset("m_iHealth"),"int");
    var iEntityTeam = memory.readMemory(dwEntity + main.getOffset("m_iTeamNum"),"int");
    if (main.LocalPlayerTeam != iEntityTeam && iEntityHealth > 0 && iCrosshair >= 1 && iCrosshair < 65){
        if (keyboard.getAsyncKeyState(parseInt(config.settings.trigger_key))){
            console.log(config.settings.trigger_delay);
            sleep.usleep(parseInt(config.settings.trigger_delay));
            memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceAttack"), 5, "int");
            sleep.usleep(5);
            if(!keyboard.getAsyncKeyState(0x01))
                memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceAttack"), 4, "int");
        }
    }
};
hook.radar = function(){
        for (var i = 1; i < 65; i++){
            var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( i - 1) * main.getOffset("m_entLoopDist"),"int");
            memory.writeMemory(dwEntity + main.getOffset("m_bSpotted"), 1, "int");
        }
};
hook.glow.start = function(){
    for (var i = 1; i < 65; i++){
        var dwEntity =  memory.readMemory(DwClientDllBaseAddress +  main.getOffset("m_dwEntityList") + ( i - 1) * main.getOffset("m_entLoopDist"),"int");
        var iEntityTeam = memory.readMemory(dwEntity + main.getOffset("m_iTeamNum"),"int");
        var bEntityDormant = memory.readMemory(dwEntity + main.getOffset("m_bDormant"),"int");
        if (!bEntityDormant)
        {
            var iGlowIndex = memory.readMemory(dwEntity + main.getOffset("m_iGlowIndex"),"int");
            if (iEntityTeam == main.LocalPlayerTeam){
                hook.glow.setGlow(iGlowIndex, 0, 1, 0, 0.5);
            }
            else 
                hook.glow.setGlow(iGlowIndex, 1, 0, 0, 0.5);
        }
    }
};
hook.glow.setGlow = function(iEntityGlowIndex, r, g, b, a){
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x4), r, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x8), g, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0xC), b, "float");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x10), a, "float");

    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x24), 1, "bool");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x25), 0, "bool");
    memory.writeMemory(main.DwGlowObjectManager + (iEntityGlowIndex * 0x38 + 0x26), 0, "bool");
};
hook.noflash = function(){
    var flashMaxAlpha = memory.readMemory(main.DwLocalPlayer + main.getOffset("m_flFlashMaxAlpha"), "float");
 
    if (flashMaxAlpha > 0.0)
    {
        memory.writeMemory(main.DwLocalPlayer + main.getOffset("m_flFlashMaxAlpha"), 0.0, "float");
    }
};
hook.bunnyhop = function(){
    var iFlags = memory.readMemory(main.DwLocalPlayer + main.getOffset("m_fFlags"), "int");
    if (keyboard.getAsyncKeyState(0x20)) 
    {
        memory.writeMemory(DwClientDllBaseAddress + main.getOffset("m_dwForceJump"), ((iFlags==257)||(iFlags==263))?5:4, "int");
    } 
};
hook.skinchanger.skins = function(){
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
hook.skinchanger.update = function(){
    _updating = true;
    var pointer = memory.readMemory(DwEngineDllBaseAddress + main.getOffset("m_dwClientState"),"int");
    memory.writeMemory(pointer + main.getOffset("m_dwFullUpdate"), -1,"int");
    setTimeout(function(){
        _updating = false;
    },5);
}
