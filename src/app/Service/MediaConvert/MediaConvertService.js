const AWS = require('aws-sdk');

const SESConfig = {
  apiVersion: process.env.APIVERSION,
  accessKeyId: process.env.ACCESSKEY_ID,
  secretAccessKey: process.env.SECRET_ACCESSKEY,
  region: process.env.REGION_CONVERT
}

AWS.config.update(SESConfig);
// Set the custom endpoint for your account
AWS.config.correctClockSkew = true;
AWS.config.mediaconvert = {
  endpoint: process.env.ENDPOINT_CONVERT
};


class MediaConvertService {
  constructor(param) {
    if (param) {
      this.params = {
        "Queue": "Default",
        "UserMetadata": {
          "Customer": "Amazon"
        },
        "Role": "arn:aws:iam::481859854768:role/OMN-MediaConvert",
        "Settings": {
          "TimecodeConfig": {
            "Source": "ZEROBASED"
          },
          "OutputGroups": [
            {
              "CustomName": "OMN",
              "Name": "Apple HLS",
              "Outputs": [{
                "ContainerSettings": {
                  "Container": "M3U8",
                  "M3u8Settings": {
                    "AudioFramesPerPes": 4,
                    "PcrControl": "PCR_EVERY_PES_PACKET",
                    "PmtPid": 480,
                    "PrivateMetadataPid": 503,
                    "ProgramNumber": 1,
                    "PatInterval": 0,
                    "PmtInterval": 0,
                    "Scte35Source": "NONE",
                    "NielsenId3": "NONE",
                    "TimedMetadata": "NONE",
                    "VideoPid": 481,
                    "AudioPids": [
                      482,
                      483,
                      484,
                      485,
                      486,
                      487,
                      488,
                      489,
                      490,
                      491,
                      492
                    ],
                    "AudioDuration": "DEFAULT_CODEC_DURATION"
                  }
                },
                "VideoDescription": {
                  "Width": 1920,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 1080,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 4000000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "AudioSourceName": "Audio Selector 1",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT"
                }],
                "OutputSettings": {
                  "HlsSettings": {
                    "AudioGroupId": "program_audio",
                    "AudioOnlyContainer": "AUTOMATIC",
                    "IFrameOnlyManifest": "EXCLUDE"
                  }
                },
                "NameModifier": "1080p"
              },
              {
                "ContainerSettings": {
                  "Container": "M3U8",
                  "M3u8Settings": {
                    "AudioFramesPerPes": 4,
                    "PcrControl": "PCR_EVERY_PES_PACKET",
                    "PmtPid": 480,
                    "PrivateMetadataPid": 503,
                    "ProgramNumber": 1,
                    "PatInterval": 0,
                    "PmtInterval": 0,
                    "Scte35Source": "NONE",
                    "NielsenId3": "NONE",
                    "TimedMetadata": "NONE",
                    "VideoPid": 481,
                    "AudioPids": [
                      482,
                      483,
                      484,
                      485,
                      486,
                      487,
                      488,
                      489,
                      490,
                      491,
                      492
                    ],
                    "AudioDuration": "DEFAULT_CODEC_DURATION"
                  }
                },
                "VideoDescription": {
                  "Width": 1280,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 720,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 2500000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT"
                }],
                "OutputSettings": {
                  "HlsSettings": {
                    "AudioGroupId": "program_audio",
                    "AudioOnlyContainer": "AUTOMATIC",
                    "IFrameOnlyManifest": "EXCLUDE"
                  }
                },
                "NameModifier": "720"
              }
              ],
              "OutputGroupSettings": {
                "Type": "HLS_GROUP_SETTINGS",
                "HlsGroupSettings": {
                  "ManifestDurationFormat": "INTEGER",
                  "SegmentLength": 10,
                  "TimedMetadataId3Period": 10,
                  "CaptionLanguageSetting": "OMIT",
                  "Destination": param.folder + param.name,
                  "Encryption": {
                    "EncryptionMethod": "SAMPLE_AES",
                    "InitializationVectorInManifest": "INCLUDE",
                    "OfflineEncrypted": "DISABLED",
                    "SpekeKeyProvider": {
                      "ResourceId": "omn-drm",
                      "SystemIds": [
                        "94CE86FB-07FF-4F43-ADB8-93D2FA968CA2"
                      ],
                      "Url": "https://kms.pallycon.com/cpix/getKey?enc-token=eyJhY2Nlc3Nfa2V5IjoiaFNXdklNYW9NaHNIUlR6XC9lZHBBbmlQdWtzNnRtMEh3VDNzK1JWQzdjd1RjZTdwRFR3TlJGa0VNZWIyV0F0aXciLCJzaXRlX2lkIjoiQ0JZQiJ9"
                    },
                    "Type": "SPEKE"
                  },
                  "TimedMetadataId3Frame": "PRIV",
                  "CodecSpecification": "RFC_4281",
                  "OutputSelection": "MANIFESTS_AND_SEGMENTS",
                  "ProgramDateTimePeriod": 600,
                  "MinSegmentLength": 0,
                  "MinFinalSegmentLength": 0,
                  "DirectoryStructure": "SINGLE_DIRECTORY",
                  "ProgramDateTime": "EXCLUDE",
                  "SegmentControl": "SEGMENTED_FILES",
                  "ManifestCompression": "NONE",
                  "ClientCache": "ENABLED",
                  "AudioOnlyHeader": "INCLUDE",
                  "StreamInfResolution": "INCLUDE"
                }
              }
            },
            {
              "CustomName": "OMN",
              "Name": "DASH ISO",
              "Outputs": [{
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "VideoDescription": {
                  "Width": 1920,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 1080,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 4000000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "NameModifier": "1080p"
              },
              {
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "VideoDescription": {
                  "Width": 1280,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 720,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 2500000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 8,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "NameModifier": "720p"
              },
              {
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "AudioSourceName": "Audio Selector 1",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT"
                }],
                "NameModifier": "Audio"
              }
              ],
              "OutputGroupSettings": {
                "Type": "DASH_ISO_GROUP_SETTINGS",
                "DashIsoGroupSettings": {
                  "SegmentLength": 30,
                  "MinFinalSegmentLength": 0,
                  "Destination": param.folder + param.name,
                  "Encryption": {
                    "PlaybackDeviceCompatibility": "CENC_V1",
                    "SpekeKeyProvider": {
                      "ResourceId": "omn-drm",
                      "SystemIds": [
                        "9A04F079-9840-4286-AB92-E65BE0885F95",
                        "EDEF8BA9-79D6-4ACE-A3C8-27DCD51D21ED"
                      ],
                      "Url": "https://kms.pallycon.com/cpix/getKey?enc-token=eyJhY2Nlc3Nfa2V5IjoiaFNXdklNYW9NaHNIUlR6XC9lZHBBbmlQdWtzNnRtMEh3VDNzK1JWQzdjd1RjZTdwRFR3TlJGa0VNZWIyV0F0aXciLCJzaXRlX2lkIjoiQ0JZQiJ9"
                    }
                  },
                  "FragmentLength": 2,
                  "SegmentControl": "SINGLE_FILE",
                  "MpdProfile": "MAIN_PROFILE",
                  "HbbtvCompliance": "NONE"
                }
              }
            },
            {
              "CustomName": "OMN MOBILE",
              "Name": "Apple HLS",
              "Outputs": [{
                "ContainerSettings": {
                  "Container": "M3U8",
                  "M3u8Settings": {
                    "AudioFramesPerPes": 4,
                    "PcrControl": "PCR_EVERY_PES_PACKET",
                    "PmtPid": 480,
                    "PrivateMetadataPid": 503,
                    "ProgramNumber": 1,
                    "PatInterval": 0,
                    "PmtInterval": 0,
                    "VideoPid": 481,
                    "AudioPids": [
                      482,
                      483,
                      484,
                      485,
                      486,
                      487,
                      488,
                      489,
                      490,
                      491,
                      492,
                      493,
                      494,
                      495,
                      496,
                      497,
                      498
                    ]
                  }
                },
                "VideoDescription": {
                  "Width": 1920,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 1080,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ParNumerator": 1,
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "FramerateDenominator": 1001,
                      "GopClosedCadence": 1,
                      "HrdBufferInitialFillPercentage": 90,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "HrdBufferSize": 12750000,
                      "MaxBitrate": 4000000,
                      "ParDenominator": 1,
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "SPECIFIED",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "HIGH",
                      "Telecine": "NONE",
                      "FramerateNumerator": 30000,
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "LEVEL_4",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "SPECIFIED",
                      "NumberBFramesBetweenReferenceFrames": 1,
                      "RepeatPps": "DISABLED"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 128000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT",
                  "AudioType": 0
                }],
                "OutputSettings": {
                  "HlsSettings": {
                    "IFrameOnlyManifest": "EXCLUDE"
                  }
                },
                "NameModifier": "1080p"
              },
              {
                "ContainerSettings": {
                  "Container": "M3U8",
                  "M3u8Settings": {
                    "AudioFramesPerPes": 4,
                    "PcrControl": "PCR_EVERY_PES_PACKET",
                    "PmtPid": 480,
                    "PrivateMetadataPid": 503,
                    "ProgramNumber": 1,
                    "PatInterval": 0,
                    "PmtInterval": 0,
                    "VideoPid": 481,
                    "AudioPids": [
                      482,
                      483,
                      484,
                      485,
                      486,
                      487,
                      488,
                      489,
                      490,
                      491,
                      492,
                      493,
                      494,
                      495,
                      496,
                      497,
                      498
                    ]
                  }
                },
                "VideoDescription": {
                  "Width": 1280,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 720,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ParNumerator": 1,
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "FramerateDenominator": 1001,
                      "GopClosedCadence": 1,
                      "HrdBufferInitialFillPercentage": 90,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "HrdBufferSize": 7500000,
                      "MaxBitrate": 2500000,
                      "SlowPal": "DISABLED",
                      "ParDenominator": 1,
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "SPECIFIED",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "FramerateNumerator": 30000,
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "LEVEL_3_1",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "SPECIFIED",
                      "NumberBFramesBetweenReferenceFrames": 1,
                      "RepeatPps": "DISABLED"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "HEV1",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT",
                  "AudioType": 0
                }],
                "OutputSettings": {
                  "HlsSettings": {
                    "IFrameOnlyManifest": "EXCLUDE"
                  }
                },
                "NameModifier": "720p"
              }
              ],
              "OutputGroupSettings": {
                "Type": "HLS_GROUP_SETTINGS",
                "HlsGroupSettings": {
                  "ManifestDurationFormat": "INTEGER",
                  "SegmentLength": 10,
                  "TimedMetadataId3Period": 10,
                  "CaptionLanguageSetting": "OMIT",
                  "Destination": param.folder + "mobile/" + param.name,
                  "TimedMetadataId3Frame": "PRIV",
                  "CodecSpecification": "RFC_4281",
                  "OutputSelection": "MANIFESTS_AND_SEGMENTS",
                  "ProgramDateTimePeriod": 600,
                  "MinSegmentLength": 0,
                  "MinFinalSegmentLength": 0,
                  "DirectoryStructure": "SINGLE_DIRECTORY",
                  "ProgramDateTime": "EXCLUDE",
                  "SegmentControl": "SEGMENTED_FILES",
                  "ManifestCompression": "NONE",
                  "ClientCache": "ENABLED",
                  "AudioOnlyHeader": "INCLUDE",
                  "StreamInfResolution": "INCLUDE"
                }
              }
            },
            {
              "CustomName": "OMN MOBILE",
              "Name": "DASH ISO",
              "Outputs": [{
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "VideoDescription": {
                  "Width": 1920,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 1080,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 4000000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "NameModifier": "1080p"
              },
              {
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "VideoDescription": {
                  "Width": 1280,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 720,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 2500000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "NameModifier": "720p"
              },
              {
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "AudioSourceName": "Audio Selector 1",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT"
                }],
                "NameModifier": "Audio"
              }
              ],
              "OutputGroupSettings": {
                "Type": "DASH_ISO_GROUP_SETTINGS",
                "DashIsoGroupSettings": {
                  "SegmentLength": 30,
                  "MinFinalSegmentLength": 0,
                  "Destination": param.folder + "mobile/" + param.name,
                  "FragmentLength": 2,
                  "SegmentControl": "SEGMENTED_FILES",
                  "MpdProfile": "MAIN_PROFILE",
                  "HbbtvCompliance": "NONE"
                }
              }
            }
          ],
          "AdAvailOffset": 0,
          "Inputs": [{
            "AudioSelectors": {
              "Audio Selector 1": {
                "Offset": 0,
                "DefaultSelection": "DEFAULT",
                "ProgramSelection": 1
              }
            },
            "VideoSelector": {
              "ColorSpace": "FOLLOW",
              "Rotate": "DEGREE_0",
              "AlphaBehavior": "DISCARD"
            },
            "FilterEnable": "AUTO",
            "PsiControl": "USE_PSI",
            "FilterStrength": 0,
            "DeblockFilter": "DISABLED",
            "DenoiseFilter": "DISABLED",
            "InputScanType": "AUTO",
            "TimecodeSource": "ZEROBASED",
            "FileInput": param.videoUrl
          }]
        },
        "AccelerationSettings": {
          "Mode": "DISABLED"
        },
        "StatusUpdateInterval": "SECONDS_60",
        "Priority": 0,
        "HopDestinations": []
      };

      this.background = {
        "Queue": "Default",
        "UserMetadata": {
          "Customer": "Amazon"
        },
        "Role": "arn:aws:iam::481859854768:role/OMN-MediaConvert",
        "Settings": {
          "TimecodeConfig": {
            "Source": "ZEROBASED"
          },
          "OutputGroups": [
            {
              "CustomName": "OMN BACKGROUND",
              "Name": "DASH ISO",
              "Outputs": [{
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "VideoDescription": {
                  "Width": 1920,
                  "ScalingBehavior": "DEFAULT",
                  "Height": 1080,
                  "TimecodeInsertion": "DISABLED",
                  "AntiAlias": "ENABLED",
                  "Sharpness": 50,
                  "CodecSettings": {
                    "Codec": "H_264",
                    "H264Settings": {
                      "InterlaceMode": "PROGRESSIVE",
                      "ScanTypeConversionMode": "INTERLACED",
                      "NumberReferenceFrames": 3,
                      "Syntax": "DEFAULT",
                      "Softness": 0,
                      "GopClosedCadence": 1,
                      "GopSize": 90,
                      "Slices": 1,
                      "GopBReference": "DISABLED",
                      "MaxBitrate": 4000000,
                      "SlowPal": "DISABLED",
                      "EntropyEncoding": "CABAC",
                      "FramerateControl": "INITIALIZE_FROM_SOURCE",
                      "RateControlMode": "QVBR",
                      "QvbrSettings": {
                        "QvbrQualityLevel": 9,
                        "QvbrQualityLevelFineTune": 0
                      },
                      "CodecProfile": "MAIN",
                      "Telecine": "NONE",
                      "MinIInterval": 0,
                      "AdaptiveQuantization": "AUTO",
                      "CodecLevel": "AUTO",
                      "FieldEncoding": "PAFF",
                      "SceneChangeDetect": "ENABLED",
                      "QualityTuningLevel": "SINGLE_PASS",
                      "FramerateConversionAlgorithm": "DUPLICATE_DROP",
                      "UnregisteredSeiTimecode": "DISABLED",
                      "GopSizeUnits": "FRAMES",
                      "ParControl": "INITIALIZE_FROM_SOURCE",
                      "NumberBFramesBetweenReferenceFrames": 2,
                      "RepeatPps": "DISABLED",
                      "DynamicSubGop": "STATIC"
                    }
                  },
                  "AfdSignaling": "NONE",
                  "DropFrameTimecode": "ENABLED",
                  "RespondToAfd": "NONE",
                  "ColorMetadata": "INSERT"
                },
                "NameModifier": "1080p"
              },
              {
                "ContainerSettings": {
                  "Container": "MPD"
                },
                "AudioDescriptions": [{
                  "AudioTypeControl": "FOLLOW_INPUT",
                  "AudioSourceName": "Audio Selector 1",
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "AudioDescriptionBroadcasterMix": "NORMAL",
                      "Bitrate": 96000,
                      "RateControlMode": "CBR",
                      "CodecProfile": "LC",
                      "CodingMode": "CODING_MODE_2_0",
                      "RawFormat": "NONE",
                      "SampleRate": 48000,
                      "Specification": "MPEG4"
                    }
                  },
                  "LanguageCodeControl": "FOLLOW_INPUT"
                }],
                "NameModifier": "Audio"
              }
              ],
              "OutputGroupSettings": {
                "Type": "DASH_ISO_GROUP_SETTINGS",
                "DashIsoGroupSettings": {
                  "SegmentLength": 30,
                  "MinFinalSegmentLength": 0,
                  "Destination": param.folder + "background/" + param.name,
                  "FragmentLength": 2,
                  "SegmentControl": "SEGMENTED_FILES",
                  "MpdProfile": "MAIN_PROFILE",
                  "HbbtvCompliance": "NONE"
                }
              }
            }
          ],
          "AdAvailOffset": 0,
          "Inputs": [{
            "AudioSelectors": {
              "Audio Selector 1": {
                "Offset": 0,
                "DefaultSelection": "DEFAULT",
                "ProgramSelection": 1
              }
            },
            "VideoSelector": {
              "ColorSpace": "FOLLOW",
              "Rotate": "DEGREE_0",
              "AlphaBehavior": "DISCARD"
            },
            "FilterEnable": "AUTO",
            "PsiControl": "USE_PSI",
            "FilterStrength": 0,
            "DeblockFilter": "DISABLED",
            "DenoiseFilter": "DISABLED",
            "InputScanType": "AUTO",
            "TimecodeSource": "ZEROBASED",
            "FileInput": param.videoUrl
          }]
        },
        "AccelerationSettings": {
          "Mode": "DISABLED"
        },
        "StatusUpdateInterval": "SECONDS_60",
        "Priority": 0,
        "HopDestinations": []
      };
    }
  }

  async createJob() {
    let endpointPromise = await new AWS.MediaConvert({
      apiVersion: '2017-08-29'
    })
      .createJob(this.params)
      .promise();

    if (endpointPromise.Job.Id) {
      return endpointPromise.Job.Id;
    } else {
      return '';
    }
  }

  async getStatus(id, program) {
    let status = await new AWS.MediaConvert({
      apiVersion: '2017-08-29'
    })
      .getJob({
        Id: id
      }, async function(err, data) {
        if (err) {
          if (err.statusCode == 404) {
            program.drmConvertError = true;
            await program.save();
          }
        }
      })
      .promise();
    return status;
  }

  // function for delete file video in s3
  async deleteFileS3(key) {
    let params = {
      Key: key,
      Bucket: "omn-video-input"
    }
    var s3 = new AWS.S3();

    s3.deleteObject(params, function (err, data) {
      if (err) console.log(err, err.stack); // error
      else console.log(); // deleted
    });
  }

  //function for delete file image in s3
  async deleteFileImageS3(key) {
    let params = {
      Key: key,
      Bucket: "omn-image-input"
    }
    var s3 = new AWS.S3();

    s3.deleteObject(params, function (err, data) {
      if (err) console.log(err, err.stack); // error
      else console.log(); // deleted
    });
  }

  async deleteFileConvert(pathName, pathFolder) {

    try {
      const listParams = {
        Bucket: "omn-video-output",
        Prefix: pathFolder, // ex. path/to/folder
      };

      var s3 = new AWS.S3();
      const listedObjects = await s3.listObjectsV2(listParams).promise();

      if (listedObjects.Contents.length === 0) return;

      const deleteParams = {
        Bucket: "omn-video-output",
        Delete: { Objects: [] },
      };

      listedObjects.Contents.forEach((content) => {
        if (content.Key.split(pathName).length > 1) {
          deleteParams.Delete.Objects.push({ Key: content.Key });
        }
      });

      await s3.deleteObjects(deleteParams).promise();

    } catch (e) {
      console.log(e);
    }
  }

  async createBackground() {
    let endpointPromise = await new AWS.MediaConvert({
      apiVersion: '2017-08-29'
    })
      .createJob(this.background)
      .promise();

    if (endpointPromise.Job.Id) {
      return endpointPromise.Job.Id;
    } else {
      return '';
    }
  }
}

module.exports = MediaConvertService;
