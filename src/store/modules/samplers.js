import Vue from "vue";
import * as Tone from "tone";
import Instruments from "@/utils/instruments";
import { Midi } from "@tonaljs/tonal";
import {
	playerType, instrumentType, eventSourceType,
    messageType, statusType, noteType,
    uiParameterType, workerParameterType,
    workerHookType,
    instNamesTemp
    } from '@/utils/types.js'

// window.onclick = () => {
//     Tone.start();
//     // Tone.context.lookAhead = 0;
// };

const state = {
    metronomeMuteStatus: true,
    humanMuteStatus: false,
    workerMuteStatus: false,

    humanSamplersVolume: 0, // in dB
    workerSamplersVolume: 0, // in dB
    metronomeSamplerVolume: 0, // in dB

    playersConfig: null,
    // metronome
    
    metronomeBus: null,
    metronomeSamplersBus: null,
    metronomeSamplers: null,
    // human
    humanBus: null,
    humanSamplersBus: null,
    humanSamplers: null,
    // worker
    workerBus: null,
    workerSamplersBus: null,
    workerSamplers: null,
    // limiter
    limiter: null,
};

const getters = {
    getmetronomeMuteStatus(state){
        return state.metronomeMuteStatus;
    },
    getUserSamplersVolume(state){
        return state.humanSamplersVolume;
    },
    getWorkerSamplersVolume(state){
        return state.workerSamplersVolume;
    },
    getMetronomeSamplerVolume(state){
        return state.metronomeSamplerVolume;
    },
};

const actions = {

    samplerOnOff(context, noteEvent){
        let durationInSeconds = noteEvent.duration.seconds + context.getters.getSecondsPerTick * noteEvent.duration.tick;
        let instrument_label = instNamesTemp[noteEvent.instrument];
        if (noteEvent.player == playerType.WORKER){
            let name = noteEvent.name;
            if (name == null){
                name = Midi.midiToNoteName(noteEvent.midi, { sharps: true });
            }
            // console.log("WorkerSAMPLER", noteEvent.midi, Tone.now() + noteEvent.playAfter.seconds)
            let instrument_to_play_on = context.state.workerSamplers[instrument_label];
            if (instrument_to_play_on == null){
                throw new Error("Instrument " + instrument_label + " not found in workerSamplers");
            } else {
                instrument_to_play_on.triggerAttackRelease(name, durationInSeconds, Tone.now() + noteEvent.playAfter.seconds, noteEvent.velocity / 127);
            }
        }

    },
    samplerOn(context, noteEvent){
        let instrument_label = instNamesTemp[noteEvent.instrument];
        if (noteEvent.player == playerType.HUMAN){
            
            let instrument_to_play_on = context.state.humanSamplers[instrument_label];
            if (instrument_to_play_on == null){
                throw new Error("Instrument " + instrument_label + " not found in humanSamplers");
            } else {
                console.log("samplerON before play ", Tone.now());
                instrument_to_play_on.triggerAttack(noteEvent.name, Tone.now() + noteEvent.playAfter.seconds, noteEvent.velocity / 127);
            }
        } else if (noteEvent.player == playerType.WORKER){
            // if noteEvent.name is null then use tonal.js to get the name of the note from noteEvent.midi
            let name = noteEvent.name;
            if (name == null){
                name = Midi.midiToNoteName(noteEvent.midi, { sharps: true });
            }
            // console.log("WorkerSAMPLER", noteEvent.midi, Tone.now() + noteEvent.playAfter.seconds)
            let instrument_to_play_on = context.state.workerSamplers[instrument_label];
            if (instrument_to_play_on == null){
                throw new Error("Instrument " + instrument_label + " not found in workerSamplers");
            } else {
                instrument_to_play_on.triggerAttack(name, Tone.now() + noteEvent.playAfter.seconds, noteEvent.velocity / 127);
            }
        } else if (noteEvent.player == playerType.METRONOME){
            // console.log("click", noteEvent)
            context.state.metronomeSamplers["click"].triggerAttack(noteEvent.name, Tone.now() + noteEvent.playAfter.seconds);
            // release the note 0.5s after the attack
            // TODO : make that depend on the beat duration
            context.state.metronomeSamplers["click"].triggerRelease(noteEvent.name, Tone.now() + noteEvent.playAfter.seconds + 500);
        }
    },
    samplerOff(context, noteEvent){
        let instrument_label = instNamesTemp[noteEvent.instrument];
        if (noteEvent.player == playerType.HUMAN){
            let instrument_to_play_on = context.state.humanSamplers[instrument_label];
            if (instrument_to_play_on == null){
                throw new Error("Instrument " + instrument_label + " not found in humanSamplers");
            } else {
                instrument_to_play_on.triggerRelease(noteEvent.name, Tone.now() + noteEvent.playAfter.seconds);
            }

        } else if (noteEvent.player == playerType.WORKER){
            let name = noteEvent.name;
            if (name == null){
                name = Midi.midiToNoteName(noteEvent.midi, { sharps: true });   
            }
            let instrument_to_play_on = context.state.workerSamplers[instrument_label];
            if (instrument_to_play_on == null){
                throw new Error("Instrument " + instrument_label + " not found in workerSamplers");
            } else {
                instrument_to_play_on.triggerRelease(name, Tone.now() + noteEvent.playAfter.seconds);
            }
        }
    },
};

const mutations = {
    // muteMetronome(state){
    //     metronomeBus.mute = state.metronomeMuteStatus;
    // },

    flipMetronomeSamplerMuteStatus(state){
        state.metronomeMuteStatus = !state.metronomeMuteStatus;
        if (state.metronomeMuteStatus){
            state.metronomeBus.mute = true;
        } else {
            state.metronomeBus.mute = false;
        }
    },

    flipHumanSamplersMuteStatus(state){
        state.humanMuteStatus = !state.humanMuteStatus;
        if (state.humanMuteStatus){
            state.humanBus.mute = true;
        } else {
            state.humanBus.mute = false;
        }
    },
    flipWorkerSamplersMuteStatus(state){
        state.workerMuteStatus = !state.workerMuteStatus;
        if (state.workerMuteStatus){
            state.workerBus.mute = true;
        } else {
            state.workerBus.mute = false;
        }
    },

    muteHumanSampler(state, instrument){
        state.humanSamplersBus[instrument].mute = true;
    },
    unmuteHumanSampler(state, instrument){
        state.humanSamplersBus[instrument].mute = false;
    },
    muteWorkerSampler(state, instrument){
        state.workerSamplersBus[instrument].mute = true;
    },
    unmuteWorkerSampler(state, instrument){
        state.workerSamplersBus[instrument].mute = false;
    },
    
    stopMute(state) {
        state.metronomeBus.mute = true;
        // state.humanBus.mute = true;
        state.workerBus.mute = true;
    },
    startUnMute(state) {
        state.metronomeBus.mute = state.metronomeMuteStatus;
        // state.humanBus.mute = state.humanMuteStatus;    
        state.workerBus.mute = state.workerMuteStatus;
    },

    createInstruments(state, config){
        state.playersConfig = config.players;
        console.log("inside setInstrumentsConfig", state.playersConfig);
        state.limiter = new Tone.Limiter(-5).toDestination();
        // const tremolo = new Tone.Tremolo(9, 0.75).toDestination().start();
        
        state.humanBus = new Tone.Channel().connect(state.limiter);
        state.humanSamplersBus = {
            synth: new Tone.Channel().connect(state.humanBus),
            piano: new Tone.Channel().connect(state.humanBus),
            drums: new Tone.Channel().connect(state.humanBus),
            upright_bass: new Tone.Channel().connect(state.humanBus),
        }
        
        state.humanSamplers = {
            synth: new Tone.PolySynth(Tone.FMSynth).connect(state.humanSamplersBus["synth"]),
            piano: new Instruments().createSampler("piano", (piano) => {
                piano.connect(state.humanSamplersBus["piano"]);
            }),
            drums: new Instruments().createSampler("drums", (drums) => {
                drums.connect(state.humanSamplersBus["drums"]);
            }),
            upright_bass: new Instruments().createSampler("upright_bass", (upright_bass) => {
                upright_bass.connect(state.humanSamplersBus["upright_bass"]);
            }),
        }
        
        state.workerBus = new Tone.Channel().connect(state.limiter);
        
        state.workerSamplersBus = {
            synth: new Tone.Channel().connect(state.workerBus),
            piano: new Tone.Channel().connect(state.workerBus),
            drums: new Tone.Channel().connect(state.workerBus),
            upright_bass: new Tone.Channel().connect(state.workerBus),
        }
        
        state.workerSamplers = {
            synth: new Tone.PolySynth(Tone.FMSynth).connect(state.workerSamplersBus["synth"]),
            piano: new Instruments().createSampler("piano", (piano) => {
                piano.connect(state.workerSamplersBus["piano"]);
            }),
            drums: new Instruments().createSampler("drums", (drums) => {
                drums.connect(state.workerSamplersBus["drums"]);
            }),
            upright_bass: new Instruments().createSampler("upright_bass", (upright_bass) => {
                upright_bass.connect(state.workerSamplersBus["upright_bass"]);
            }),
        }
        
        state.metronomeBus = new Tone.Channel().connect(state.limiter);
        state.metronomeSamplersBus = {
            click: new Tone.Channel().connect(state.metronomeBus),
        }
        state.metronomeSamplers = {
            click: new Instruments().createSampler(
                "click",
                (metronome) => {
                    metronome.release = 0.2;
                    metronome.connect(state.metronomeSamplersBus["click"]);
                }),
        }
        
        state.metronomeBus.mute = true;
        // state.metronomeSampler.connect(state.metronomeBus);

        // TODO : automatically parse the playersConfig create only the samplers we need
        // TODO : also set the default volumes and mute states. 
        console.log(state.humanSamplers);
    },

    handleMixerUpdate(state, update){
        // console.log("inside handleMixerUpdate ", update);
        let isVolume = false;
        let isMute = false; 
        if (update.what == 'mute'){
            isMute = true;
        } else if (update.what == 'volume'){
            isVolume = true
        } else {
            console.error("unknown mixer variable type, check confi_players.yaml, we only suppoer 'mute' and 'volume'")
        }
        
        // find which bus
        let player = update.playerId;
        let instrument = update.instrumentId;
        let playerBus = null;
        let instrumentsBus = null;
        let finalBus = null;
        if (player == 'human'){
            playerBus = state.humanBus;
            instrumentsBus = state.humanSamplersBus;
        } else if (player == 'worker'){
            playerBus = state.workerBus;
            instrumentsBus = state.workerSamplersBus;
        } else if (player == 'metronome'){
            playerBus = state.metronomeBus;
            instrumentsBus = state.metronomeSamplersBus;
        }
        if (instrument != null){
            finalBus = instrumentsBus[`${instrument}`];
        } else {
            finalBus = playerBus;
        }
        if (isVolume == true){
            let volume = update.value.value;
            // if volume == 10, then volumeDB = 0 else,  -Math.abs(20*Math.log(volume/10));
            const volumeDB = volume === 10 ? 0 : -Math.abs(20 * Math.log(volume / 10));
            finalBus.volume.value = volumeDB;
            // console.log("settin volume ", volumeDB, "to channel ", finalBus);
        } else if (isMute == true) {
            finalBus.mute = update.value.value;
        }
        
    },
};

export default {
    state,
    getters,
    actions,
    mutations,
};
