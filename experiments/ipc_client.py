import json
import socket
import os
import struct

class HandlebarsClient:
    def __init__(self):
        self.socket_path = r'\\.\pipe\handlebars-ipc' if os.name == 'nt' else '/tmp/handlebars-ipc'
        self.socket = socket.socket(socket.AF_UNIX if os.name != 'nt' else socket.AF_PIPE, socket.SOCK_STREAM)

    def connect(self):
        self.socket.connect(self.socket_path)

    def render_template(self, template, context, layout="main.hbs"):
        request = json.dumps({
            'template': template,
            'context': context,
            'layout': layout
        })

        # Send the request
        self._send_message('render', request)

        # Receive the response
        response = self._receive_message()
        response_data = json.loads(response)

        if response_data['status'] == 'success':
            return response_data['html']
        else:
            raise Exception(response_data['message'])

    def _send_message(self, event, data):
        message = f"{event}:{data}"
        self.socket.sendall(struct.pack('>I', len(message)) + message.encode())

    def _receive_message(self):
        raw_msglen = self._recvall(4)
        if not raw_msglen:
            return None
        msglen = struct.unpack('>I', raw_msglen)[0]
        return self._recvall(msglen).decode()

    def _recvall(self, n):
        data = b''
        while len(data) < n:
            packet = self.socket.recv(n - len(data))
            if not packet:
                return None
            data += packet
        return data

    def close(self):
        self.socket.close()

# Usage
client = HandlebarsClient()
try:
    client.connect()
    result = client.render_template(
        "hello.hbs",
        {"name": "World"},
        "main.hbs"
    )
    print("Final result:")
    print(result)
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    client.close()