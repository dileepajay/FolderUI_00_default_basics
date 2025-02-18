import os
import time
from plugin_system.base_plugin import BasePlugin

class open(BasePlugin): 
    def __init__(self,data): 
        super().__init__(data)


    def process(self):
        print(f'self.accepting_files: {self.accepting_files}')
        print(f'self.parameters: {self.parameters}')
        self.output_files = self.accepting_files
        self.expected_output = self.accepting_files
        self.progress_in = "completed"
        self.progress = 100
        self.status = "completed"
        self.end_time = time.time()
        self.duration = round(self.end_time - self.start_time, 2)