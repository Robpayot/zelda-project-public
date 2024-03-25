export default {
  name: 'Main',

  resources: [
    // horizon
    {
      name: 'horizon',
      type: 'gltf',
      path: './models/horizon.glb',
    },
    // boat
    {
      name: 'boat',
      type: 'gltf',
      path: './models/boat_link_crane_master_fake.glb',
    },
    // game objects
    {
      name: 'rupee',
      type: 'gltf',
      path: './models/rupee.glb',
    },
    {
      name: 'barrel',
      type: 'gltf',
      path: './models/barrel2.glb',
    },
    {
      name: 'ship_grey',
      type: 'gltf',
      path: './models/ship_grey.glb',
    },
    {
      name: 'ship',
      type: 'gltf',
      path: './models/ship.glb',
    },
    {
      name: 'wall',
      type: 'gltf',
      path: './models/wall.glb',
    },
    {
      name: 'tower',
      type: 'gltf',
      path: './models/tower.glb',
    },
    {
      name: 'wind',
      type: 'gltf',
      path: './models/wind.glb',
    },
    {
      name: 'mirador',
      type: 'gltf',
      path: './models/mirador.glb',
    },
    {
      name: 'seabox',
      type: 'gltf',
      path: './models/seabox.glb',
    },
    // islands
    {
      name: 'islands',
      type: 'gltf',
      path: './models/islands.glb',
    },
    // ocean
    {
      name: 'ocean-tile',
      type: 'texture',
      path: './img/Water/ocean.png',
    },
    {
      name: 'bubble',
      type: 'texture',
      path: './img/Water/bubble2.png',
    },
    {
      name: 'trail',
      type: 'texture',
      path: './img/Water/trail.png',
    },
    {
      name: 'wave',
      type: 'texture',
      path: './img/Water/waves.png',
    },

    // clouds
    {
      name: 'long-cloud-1',
      type: 'texture',
      path: './img/Long_Clouds/long-1-fix.png',
    },
    {
      name: 'long-cloud-2',
      type: 'texture',
      path: './img/Long_Clouds/long-2-fix.png',
    },
    {
      name: 'long-cloud-back-1',
      type: 'texture',
      path: './img/Long_Clouds/long-back-1.png',
    },
    {
      name: 'long-cloud-back-2',
      type: 'texture',
      path: './img/Long_Clouds/long-back-2.png',
    },
    {
      name: 'small-cloud-1',
      type: 'texture',
      path: './img/Small_Clouds/small-1.png',
    },
    {
      name: 'small-cloud-2',
      type: 'texture',
      path: './img/Small_Clouds/small-2.png',
    },
    {
      name: 'small-cloud-3',
      type: 'texture',
      path: './img/Small_Clouds/small-3.png',
    },
    {
      name: 'lightning',
      type: 'texture',
      path: './img/lightning.png',
    },
    // gltf textures
    {
      name: 'eyebrow-1',
      type: 'texture',
      path: './img/textures-gltf/mayuh.1.png',
    },
    // mouth
    {
      name: 'mouth1',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.1.png',
    },
    {
      name: 'mouth2',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.2.png',
    },
    {
      name: 'mouth3',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.3.png',
    },
    {
      name: 'mouth4',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.5.png',
    },
    {
      name: 'mouth5',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.6.png',
    },
    {
      name: 'mouth6',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.7.png',
    },
    {
      name: 'mouth7',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.8.png',
      options: {
        flipY: false,
      },
    },
    {
      name: 'mouth8',
      type: 'texture',
      path: './img/textures-gltf/mouthS3TC.9.png',
      options: {
        flipY: false,
      },
    },
    // dark link + mouth
    {
      name: 'dark_tunic',
      type: 'texture',
      path: './img/textures-gltf/dark_tunic.png',
      options: {
        flipY: false,
      },
    },
    {
      name: 'dark_pupil',
      type: 'texture',
      path: './img/textures-gltf/dark_pupil.png',
      options: {
        flipY: false,
      },
    },
    // dark mouth
    {
      name: 'dark-mouth1',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth1.png',
    },
    {
      name: 'dark-mouth2',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth2.png',
    },
    {
      name: 'dark-mouth3',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth3.png',
    },
    {
      name: 'dark-mouth4',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth5.png',
    },
    {
      name: 'dark-mouth5',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth6.png',
    },
    {
      name: 'dark-mouth6',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth7.png',
    },
    {
      name: 'dark-mouth7',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth8.png',
      options: {
        flipY: false,
      },
    },
    {
      name: 'dark-mouth8',
      type: 'texture',
      path: './img/textures-gltf/dark-mouth9.png',
      options: {
        flipY: false,
      },
    },
    // eyes
    {
      name: 'eye-1',
      type: 'texture',
      path: './img/textures-gltf/eyeh.1.png',
    },
    {
      name: 'eye-2',
      type: 'texture',
      path: './img/textures-gltf/eyeh.2.png',
    },
    {
      name: 'eye-3',
      type: 'texture',
      path: './img/textures-gltf/eyeh.4.png',
    },
    {
      name: 'eye-4',
      type: 'texture',
      path: './img/textures-gltf/eyeh.5.png',
    },
    {
      name: 'eye-5',
      type: 'texture',
      path: './img/textures-gltf/eyeh.6.png',
    },
    {
      name: 'eye-6',
      type: 'texture',
      path: './img/textures-gltf/eyeh.7.png',
    },
    // pupil
    {
      name: 'pupil',
      type: 'texture',
      path: './img/textures-gltf/hitomi.png',
    },
    // islands
    {
      name: 'island_0',
      type: 'gltf',
      path: './models/island_0_new.glb',
    },
    {
      name: 'island_1',
      type: 'gltf',
      path: './models/island_1_new.glb',
    },
    {
      name: 'island_2',
      type: 'gltf',
      path: './models/island_2_new.glb',
    },
    {
      name: 'island_3',
      type: 'gltf',
      path: './models/island_3_new.glb',
    },
    {
      name: 'island_4',
      type: 'gltf',
      path: './models/island_4_new.glb',
    },
    {
      name: 'island_5',
      type: 'gltf',
      path: './models/island_5_new.glb',
    },
    {
      name: 'island_oasis',
      type: 'gltf',
      path: './models/island_oasis.glb',
    },
    // triforce shards
    {
      name: 'triforce_shards',
      type: 'gltf',
      path: './models/triforce_shards.glb',
    },
  ],
}
