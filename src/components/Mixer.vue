<template>
    <div ref="mixer" id="mixerId" :width="width" :height="height" 
            style="position: absolute; top: 150px; left: 20px; z-index: 100">
    </div>
  </template>
  
  <script>
  import {Pane} from 'tweakpane';

  export default {
    name: 'Mixer',
    props: {
        // dataFromParent: {
        //     type: Object,
        //     default: () => {}
        // },
        width: {
          type: Number,
          default: 400
        },
        height: {
          type: Number,
          default: 400
        },
        cssClasses: {
          default: '',
          type: String
        },
        styles: {
          type: Object,
          default: () => {}
        },
      },
    data() {
        return {
            pane: null,
            data: {},
            playersConfig: null,
            title: "",
        };
    },
    beforeCreate(){
        console.log("beforeCreate mixer start")
        // this.$root.$refs.mixer = this;
        console.log("beforeCreate mixer end")
    },
    created() {
        console.log("created mixer start")
        this.$root.$refs.mixer = this;
        // this.startAnalyser();
        console.log(" created mixer end")
    },
    mounted() {
        console.log("mounted mixer start")
    },
  
    methods: {
        loadMixerConfig(playersConfig) {
            let vm = this;
            vm.playersConfig = playersConfig;
            vm.pane = new Pane({
              container: vm.$refs.mixer,
              title: 'Mixer',
            })
            // vm.pane.on('change', (ev) => {
            //     console.log(ev);
            //     console.log('changed: ' + JSON.stringify(ev.value));
            // });
            
            // Create the mixer data object for Pane. 
            for (const [player, playerData] of Object.entries(vm.playersConfig)) {
                vm.data[`${player}`] = {
                    label: playerData.label,
                    mute: playerData.mute,
                    volume: playerData.volume,
                    instruments: {}
                };
                playerData.instruments.forEach((instrument) => {
                    console.log(instrument.id + " " + instrument.label)
                    vm.data[`${player}`].instruments[`${instrument.id}`] = {
                        label: instrument.label,
                        mute: instrument.mute,
                        volume: instrument.volume,
                    };
                });
            };

            // Iterate over the 'players' in the config file
            for (const [player, playerData] of Object.entries(vm.data)) {
                console.log(player, " ", playerData);
                const playerFolder = vm.pane.addFolder({
                    title: playerData.label,
                    expanded: true,
                });
                playerFolder.addInput(vm.data[player], 'volume',
                    {
                        label: "vol.",
                        min: 1,
                        max: 10
                    }).on('change', (ev) => {
                        let changeEvent = {
                            playerId: player,
                            instrumentId: null,
                            what: 'volume',
                            value : ev
                        }
                        vm.updateData(changeEvent);
                    }
                );
                playerFolder.addInput(vm.data[player], 'mute',
                    {
                        label: "mute",
                    }).on('change', (ev) => {
                        let changeEvent = {
                            playerId: player,
                            instrumentId: null,
                            what: 'mute',
                            value : ev
                        }
                        vm.updateData(changeEvent);
                    }
                );
                for (const [instId, instData] of Object.entries(playerData.instruments)) {
                    console.log(instData.label);
                    // player.instruments.forEach((instrument) => {
                    const instFolder = playerFolder.addFolder({
                        title: instData.label,
                        expanded: false,
                    });
                    console.log("added sub")
                    instFolder.addInput(vm.data[player].instruments[instId], 'volume',
                        {
                            label: "vol.",
                            min: 1,
                            max: 10
                        }).on('change', (ev) => {
                            let changeEvent = {
                                playerId: player,
                                instrumentId: instId,
                                what: 'volume',
                                value : ev
                            }
                            vm.updateData(changeEvent);
                        }
                    );
                    instFolder.addInput(vm.data[player].instruments[instId], 'mute',
                        {
                            label: "mute",
                        }).on('change', (ev) => {
                            let changeEvent = {
                                playerId: player,
                                instrumentId: instId,
                                what: 'mute',
                                value : ev
                            }
                            vm.updateData(changeEvent);
                        }
                    );
                };
            }
        },
        updateData(changeEvent) {
            // Emit a signal to push the mixer change
            // to the parent component, which will update 
            // the samplers' statuses
            this.$emit('newEventSignal', changeEvent);
        }
    },
  
  };
  </script>
  <style>
  :root {
    --tp-base-background-color: hsla(0, 9%, 22%, 0.863);
    --tp-base-shadow-color: hsla(44, 78%, 24%, 0.247);
    /* --tp-button-background-color: hsla(0, 0%, 80%, 1); */
    --tp-button-background-color-active: hsla(0, 0%, 100%, 1);
    --tp-button-background-color-focus: hsla(0, 0%, 95%, 1);
    --tp-button-background-color-hover: hsla(0, 0%, 85%, 1);
    --tp-button-foreground-color: hsla(0, 0%, 0%, 0.8);
    /* --tp-container-background-color: hsla(0, 0%, 0%, 0.795); */
    --tp-container-background-color-active: hsla(0, 0%, 0%, 0.781);
    --tp-container-background-color-focus: hsla(0, 0%, 0%, 0.719);
    --tp-container-background-color-hover: hsla(36, 89%, 26%, 0.4); 
    --tp-container-foreground-color: hsla(0, 0%, 100%, 0.5);
    --tp-groove-foreground-color: hsla(0, 78%, 51%, 0.2);
    /* --tp-input-background-color: hsla(0, 81%, 46%, 0.822); */
    --tp-input-background-color-active: hsla(0, 0%, 0%, 0.6);
    --tp-input-background-color-focus: hsla(0, 0%, 0%, 0.5);
    --tp-input-background-color-hover: hsla(45, 72%, 14%, 0.541);
    --tp-input-foreground-color: hsla(41, 92%, 42%, 0.911);
    --tp-label-foreground-color: hsla(39, 53%, 86%, 0.945);
    --tp-mixer-background-color: hsla(0, 0%, 0%, 0.3);
    --tp-mixer-foreground-color: hsla(0, 0%, 100%, 0.3);
  }
  </style>