export type Fall = {
    "version": "0.1.0",
    "name": "fall",
    "instructions": [
      {
        "name": "createAmm",
        "accounts": [
          {
            "name": "amm",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "admin",
            "isMut": false,
            "isSigner": false
          },
          {
            "name": "payer",
            "isMut": true,
            "isSigner": true
          },
          {
            "name": "systemProgram",
            "isMut": false,
            "isSigner": false
          }
        ],
        "args": [
          {
            "name": "id",
            "type": "publicKey"
          },
          {
            "name": "fee",
            "type": "u16"
          }
        ]
      }
    ]
  };