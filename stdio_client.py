#EXAMPLE TO BE COPIED, MODIFIED, OR PORTED TO OTHER LANGUAGES
import subprocess
import json

class HandlebarsClient:
    def __init__(self):
        self.process = subprocess.Popen(
            ['node', 'stdio_service.js', 
             '--main', 'noLayout.hbs'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )

    def render_template(self, template, context, layout=None):
        request_data = {
            'template': template,
            'context': context,
        }
        if layout: request_data['layout'] = layout
        request = json.dumps(request_data)
        
        self.process.stdin.write(request + '\n')
        self.process.stdin.flush()

        response = ""
        while True:
            line = self.process.stdout.readline()
            if line.strip().endswith(":EOF:"):
                response += line.rsplit(":EOF:", 1)[0]
                break
            response += line

        if response.startswith("SUCCESS:"):
            rendered_html = response[8:].strip()
            return rendered_html
        else:
            raise Exception(response)

    def close(self):
        self.process.terminate()

# Usage
client = HandlebarsClient() #QUEUE POOL WHEN STRESSED
try:
    result = client.render_template(
        "hello.hbs",
        {"name": "World"},
        #"main.hbs"
    )
    print("Final result:")
    print(result)
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    client.close()

# Check for any stderr output
stderr_output = client.process.stderr.read()
if stderr_output:
    print("Error output from Node process:")
    print(stderr_output)